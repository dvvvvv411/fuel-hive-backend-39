import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as pdfjs from 'pdfjs-dist';

// Set up PDF.js worker - use local worker for reliability
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  invoice_pdf_url: string;
  selected_bank_account_id: string;
  created_at: string;
  invoice_generation_date: string;
  shop_id: string;
  shops: {
    name: string;
  };
}

interface BankAccount {
  id: string;
  account_name: string;
  iban: string;
}

interface WrongOrder {
  order: Order;
  expectedIban: string;
  foundIban: string;
  bankAccountName: string;
}

export function WrongOrdersList() {
  const [wrongOrders, setWrongOrders] = useState<WrongOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingCount, setProcessingCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadAndAnalyzeOrders();
  }, []);

  const normalizeIban = (iban: string, expectedLength?: number): string => {
    // Remove all non-alphanumeric characters and convert to uppercase
    let normalized = iban.replace(/[^A-Z0-9]/g, '').toUpperCase();
    
    // If we have an expected length, truncate to that length
    if (expectedLength && normalized.length > expectedLength) {
      normalized = normalized.substring(0, expectedLength);
    }
    
    // For German IBANs, ensure max 22 characters
    if (normalized.startsWith('DE') && normalized.length > 22) {
      normalized = normalized.substring(0, 22);
    }
    
    return normalized;
  };

  const extractIbanFromPdf = async (pdfUrl: string): Promise<string | null> => {
    let pdf: any = null;
    try {
      console.log('Extracting IBAN from PDF:', pdfUrl);
      const response = await fetch(pdfUrl);
      const arrayBuffer = await response.arrayBuffer();
      pdf = await pdfjs.getDocument(arrayBuffer).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        try {
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + ' ';
          
          // Check if we found an IBAN on this page to exit early
          const quickIbanCheck = /IBAN[:\s]*(DE\s*\d{2}(?:\s*\d){18})|(\bDE\s*\d{2}(?:\s*\d){18})/gi;
          if (quickIbanCheck.test(pageText)) {
            // We found a potential IBAN, process this page and stop
            break;
          }
        } finally {
          // Clean up page resources
          page.cleanup();
        }
      }

      console.log('Full PDF text extracted (first 500 chars):', fullText.substring(0, 500));

      // Primary: Look for German IBAN with capturing group, stop before BIC/SWIFT
      const germanIbanWithLabelRegex = /IBAN[:\s]*(DE\s*\d{2}(?:\s*\d){18})(?=\s*(?:BIC|SWIFT)\b|\s|$)/gi;
      const labelMatch = germanIbanWithLabelRegex.exec(fullText);
      
      if (labelMatch && labelMatch[1]) {
        console.log('Found IBAN with label:', labelMatch[1]);
        // Remove anything after potential BIC/SWIFT markers
        let cleanIban = labelMatch[1].split(/\s*BIC\s*|SWIFT/i)[0];
        return normalizeIban(cleanIban);
      }

      // Fallback: Look for German IBAN pattern without label, stop before BIC
      const germanIbanRegex = /\b(DE\s*\d{2}(?:\s*\d){18})(?=\s*(?:BIC|SWIFT)\b|\s|$)/gi;
      const germanMatch = germanIbanRegex.exec(fullText);
      
      if (germanMatch && germanMatch[1]) {
        console.log('Found German IBAN pattern:', germanMatch[1]);
        return normalizeIban(germanMatch[1]);
      }

      // Last resort: Look for any potential IBAN starting with common country codes
      const anyIbanRegex = /\b([A-Z]{2}\s*\d{2}(?:\s*[A-Z0-9]){15,30})(?=\s*(?:BIC|SWIFT)\b|\s|$)/gi;
      const anyMatch = anyIbanRegex.exec(fullText);
      
      if (anyMatch && anyMatch[1]) {
        console.log('Found potential IBAN:', anyMatch[1]);
        return normalizeIban(anyMatch[1]);
      }
      
      console.log('No IBAN found in PDF');
      return null;
    } catch (error) {
      console.error('Error extracting IBAN from PDF:', error);
      return null;
    } finally {
      // Clean up PDF resources
      if (pdf) {
        try {
          pdf.cleanup();
          await pdf.destroy();
        } catch (cleanupError) {
          console.error('Error cleaning up PDF resources:', cleanupError);
        }
      }
    }
  };

  // Helper function for parallel processing with concurrency limit
  const processWithConcurrency = async <T, R>(
    items: T[],
    limit: number,
    processFn: (item: T, index: number) => Promise<R>
  ): Promise<R[]> => {
    const results: R[] = [];
    const executing: Promise<void>[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const promise = processFn(items[i], i).then(result => {
        results[i] = result;
      });
      
      executing.push(promise);
      
      if (executing.length >= limit) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
      
      // Update progress counter
      setProcessingCount(i + 1);
    }
    
    await Promise.all(executing);
    return results;
  };

  const loadAndAnalyzeOrders = async () => {
    try {
      setLoading(true);
      
      // Load orders with invoice PDFs - get count first
      const { count, error: countError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('invoice_pdf_generated', true)
        .eq('invoice_sent', true)
        .not('invoice_pdf_url', 'is', null)
        .not('selected_bank_account_id', 'is', null);

      if (countError) throw countError;

      setTotalCount(count || 0);
      
      // Load orders in batches of 200
      const allOrders: any[] = [];
      const batchSize = 200;
      let from = 0;
      
      while (true) {
        const { data: orderBatch, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            customer_name,
            customer_email,
            total_amount,
            invoice_pdf_url,
            selected_bank_account_id,
            created_at,
            invoice_generation_date,
            shop_id,
            shops (
              name
            )
          `)
          .eq('invoice_pdf_generated', true)
          .eq('invoice_sent', true)
          .not('invoice_pdf_url', 'is', null)
          .not('selected_bank_account_id', 'is', null)
          .order('created_at', { ascending: false })
          .range(from, from + batchSize - 1);

        if (ordersError) throw ordersError;
        
        if (!orderBatch || orderBatch.length === 0) break;
        
        allOrders.push(...orderBatch);
        from += batchSize;
        
        // If we got less than batchSize, we're done
        if (orderBatch.length < batchSize) break;
      }
      
      // Load all bank accounts
      const { data: bankAccounts, error: bankError } = await supabase
        .from('bank_accounts')
        .select('id, account_name, iban');

      if (bankError) throw bankError;

      const bankAccountsMap = new Map<string, BankAccount>();
      bankAccounts?.forEach(account => {
        bankAccountsMap.set(account.id, account);
      });

      setTotalCount(allOrders.length);
      const discrepancies: WrongOrder[] = [];

      // Process orders with parallel processing (5 concurrent PDFs)
      if (allOrders && allOrders.length > 0) {
        const processOrder = async (order: any, index: number): Promise<WrongOrder | null> => {
          const expectedBankAccount = bankAccountsMap.get(order.selected_bank_account_id);
          if (!expectedBankAccount) return null;

          const expectedIban = normalizeIban(expectedBankAccount.iban);
          
          try {
            console.log(`Processing order ${order.order_number}, expected IBAN: ${expectedIban}`);
            const foundIban = await extractIbanFromPdf(order.invoice_pdf_url);
            
            if (foundIban) {
              const normalizedFound = normalizeIban(foundIban);
              console.log(`Order ${order.order_number} - Expected: ${expectedIban}, Found: ${foundIban}, Normalized: ${normalizedFound}`);
              
              if (normalizedFound.length !== expectedIban.length) {
                console.log(`Skipping comparison for order ${order.order_number}: found IBAN length ${normalizedFound.length} != expected ${expectedIban.length}`);
                return null;
              } else if (normalizedFound !== expectedIban) {
                console.log(`MISMATCH detected for order ${order.order_number}`);
                return {
                  order,
                  expectedIban,
                  foundIban: normalizedFound,
                  bankAccountName: expectedBankAccount.account_name
                };
              }
            } else {
              console.log(`No IBAN found in PDF for order ${order.order_number}`);
            }
            return null;
          } catch (error) {
            console.error(`Error processing order ${order.order_number}:`, error);
            return null;
          }
        };

        // Process with concurrency limit of 5
        const results = await processWithConcurrency(allOrders, 5, processOrder);
        
        // Filter out null results
        const validDiscrepancies = results.filter((result): result is WrongOrder => result !== null);
        discrepancies.push(...validDiscrepancies);
      }

      setWrongOrders(discrepancies);
      
      if (discrepancies.length > 0) {
        toast({
          title: "IBAN-Diskrepanzen gefunden",
          description: `${discrepancies.length} Bestellungen mit falschen IBANs entdeckt`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Keine Diskrepanzen gefunden",
          description: "Alle geprüften Rechnungen haben korrekte IBANs",
        });
      }

    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der Bestellungen",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate summary statistics for wrong orders
  const calculateSummary = () => {
    const totalLostAmount = wrongOrders.reduce((sum, wrongOrder) => sum + wrongOrder.order.total_amount, 0);
    
    const ibanStats = wrongOrders.reduce((acc, wrongOrder) => {
      const iban = wrongOrder.foundIban;
      if (!acc[iban]) {
        acc[iban] = { amount: 0, count: 0 };
      }
      acc[iban].amount += wrongOrder.order.total_amount;
      acc[iban].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number }>);

    return { totalLostAmount, ibanStats };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-red-600">FALSCHE ORDERS</h2>
          <p className="text-gray-600">
            Bestellungen mit falschen IBANs in den versendeten Rechnungen
          </p>
        </div>
        <Button onClick={loadAndAnalyzeOrders} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analysiere...
            </>
          ) : (
            'Erneut prüfen'
          )}
        </Button>
      </div>

      {!loading && wrongOrders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-red-600">Verluste</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(calculateSummary().totalLostAmount)}
              </div>
              <p className="text-sm text-gray-600">Gesamtbetrag der falschen Bestellungen</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Falsche IBANs Übersicht</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(calculateSummary().ibanStats).map(([iban, stats]) => (
                  <div key={iban} className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <div>
                      <div className="font-mono text-sm">{iban}</div>
                      <div className="text-xs text-gray-600">{stats.count} Bestellungen</div>
                    </div>
                    <div className="font-semibold text-red-600">
                      {formatCurrency(stats.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <div className="text-center">
                <p className="text-lg font-medium">
                  Analysiere Rechnungs-PDFs...
                </p>
                <p className="text-sm text-gray-600">
                  {processingCount} von {totalCount} Bestellungen geprüft
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && wrongOrders.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-green-600">
              Keine Diskrepanzen gefunden
            </h3>
            <p className="text-gray-600">
              Alle geprüften Rechnungen haben korrekte IBANs.
            </p>
          </CardContent>
        </Card>
      )}

      {wrongOrders.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-600">
                {wrongOrders.length} Bestellungen mit falschen IBANs
              </CardTitle>
            </div>
            <CardDescription>
              Diese Bestellungen haben in der versendeten Rechnung eine andere IBAN 
              als die aktuell hinterlegte Bankverbindung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bestellnummer</TableHead>
                  <TableHead>Kunde</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Betrag</TableHead>
                  <TableHead>Erwartete IBAN</TableHead>
                  <TableHead>Gefundene IBAN</TableHead>
                  <TableHead>Bankkontoname</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead>Versendet</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wrongOrders.map((wrongOrder) => (
                  <TableRow key={wrongOrder.order.id} className="border-red-100">
                    <TableCell className="font-medium">
                      {wrongOrder.order.order_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{wrongOrder.order.customer_name}</div>
                        <div className="text-sm text-gray-500">{wrongOrder.order.customer_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{wrongOrder.order.shops.name}</TableCell>
                    <TableCell>{formatCurrency(wrongOrder.order.total_amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {wrongOrder.expectedIban}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {wrongOrder.foundIban}
                      </Badge>
                    </TableCell>
                    <TableCell>{wrongOrder.bankAccountName}</TableCell>
                    <TableCell>{formatDate(wrongOrder.order.created_at)}</TableCell>
                    <TableCell>{formatDateTime(wrongOrder.order.invoice_generation_date)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(wrongOrder.order.invoice_pdf_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        PDF ansehen
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}