import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertTriangle, ExternalLink, Loader2, CalendarIcon, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
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
  const [loading, setLoading] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

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
      // Read all pages - no early break
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        try {
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + ' ';
        } finally {
          // Clean up page resources
          page.cleanup();
        }
      }

      console.log('Full PDF text extracted (first 500 chars):', fullText.substring(0, 500));

      // Collect all IBAN candidates
      const candidates: string[] = [];
      
      // Find labeled IBANs (with "IBAN:" prefix)
      const labeledIbanRegex = /IBAN[:\s]*(DE\s*\d{2}(?:\s*\d){18})/gi;
      let match;
      while ((match = labeledIbanRegex.exec(fullText)) !== null) {
        candidates.push(normalizeIban(match[1]));
      }
      
      // Find unlabeled German IBANs
      const unlabeledIbanRegex = /\b(DE\s*\d{2}(?:\s*\d){18})\b/gi;
      while ((match = unlabeledIbanRegex.exec(fullText)) !== null) {
        const normalized = normalizeIban(match[1]);
        if (!candidates.includes(normalized)) {
          candidates.push(normalized);
        }
      }

      if (candidates.length === 0) {
        console.log('No IBAN found in PDF');
        return null;
      }

      if (candidates.length === 1) {
        console.log('Found single IBAN:', candidates[0]);
        return candidates[0];
      }

      // Multiple candidates - use heuristics to find the best one
      console.log('Found multiple IBAN candidates:', candidates);

      // Look for "Zahlungsdetails" section and find IBANs nearby
      const zahlungsdetailsIndex = fullText.toLowerCase().indexOf('zahlungsdetails');
      if (zahlungsdetailsIndex !== -1) {
        // Extract text around Zahlungsdetails (±400 characters)
        const contextStart = Math.max(0, zahlungsdetailsIndex - 200);
        const contextEnd = Math.min(fullText.length, zahlungsdetailsIndex + 400);
        const contextText = fullText.substring(contextStart, contextEnd);
        
        // Find IBANs in this context
        const contextIbanRegex = /\b(DE\s*\d{2}(?:\s*\d){18})\b/gi;
        let contextMatch;
        while ((contextMatch = contextIbanRegex.exec(contextText)) !== null) {
          const contextIban = normalizeIban(contextMatch[1]);
          if (candidates.includes(contextIban)) {
            console.log('Using IBAN from Zahlungsdetails context:', contextIban);
            return contextIban;
          }
        }
      }

      // If no Zahlungsdetails context or no IBAN found there, take the last IBAN
      const chosenIban = candidates[candidates.length - 1];
      console.log('Using last found IBAN:', chosenIban, 'from candidates:', candidates);
      return chosenIban;
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
      }).finally(() => {
        // Remove completed promise from executing array
        const index = executing.indexOf(promise);
        if (index > -1) {
          executing.splice(index, 1);
        }
      });
      
      executing.push(promise);
      
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
      
      // Update progress counter
      setProcessingCount(i + 1);
    }
    
    await Promise.all(executing);
    return results;
  };

  const loadAndAnalyzeOrders = async () => {
    if (!dateFrom || !dateTo) {
      toast({
        title: "Zeitraum erforderlich",
        description: "Bitte wählen Sie einen Zeitraum aus",
        variant: "destructive"
      });
      return;
    }

    if (dateTo < dateFrom) {
      toast({
        title: "Ungültiger Zeitraum",
        description: "Das End-Datum muss nach dem Start-Datum liegen",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      setWrongOrders([]);
      setHasAnalyzed(false);
      
      // Create date range filter (start of dateFrom to end of dateTo)
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      
      // Load orders with invoice PDFs - get count first
      let query = supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('invoice_pdf_generated', true)
        .eq('invoice_sent', true)
        .not('invoice_pdf_url', 'is', null)
        .not('selected_bank_account_id', 'is', null)
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString());

      const { count, error: countError } = await query;

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
          .gte('created_at', fromDate.toISOString())
          .lte('created_at', toDate.toISOString())
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
              
              // For German IBANs, ensure both are trimmed to 22 characters before comparison
              let finalExpected = expectedIban;
              let finalFound = normalizedFound;
              
              if (expectedIban.startsWith('DE') && expectedIban.length > 22) {
                finalExpected = expectedIban.substring(0, 22);
              }
              if (normalizedFound.startsWith('DE') && normalizedFound.length > 22) {
                finalFound = normalizedFound.substring(0, 22);
              }
              
              // Only skip if the found IBAN is clearly invalid (too short for DE)
              if (normalizedFound.startsWith('DE') && normalizedFound.length < 22) {
                console.log(`Skipping comparison for order ${order.order_number}: found IBAN too short (${normalizedFound.length} chars)`);
                return null;
              }
              
              if (finalFound !== finalExpected) {
                console.log(`MISMATCH detected for order ${order.order_number}`);
                return {
                  order,
                  expectedIban: finalExpected,
                  foundIban: finalFound,
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
      setHasAnalyzed(true);
      
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
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-blue-600">Sicherheitscheck</h2>
          <p className="text-gray-600">
            Überprüfung der IBANs in versendeten Rechnungen für ausgewählten Zeitraum
          </p>
        </div>
      </div>

      {/* Date Range Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Zeitraum auswählen</CardTitle>
          <CardDescription>
            Wählen Sie den Zeitraum aus, für den die Rechnungen überprüft werden sollen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Von:</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP", { locale: de }) : "Datum wählen"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Bis:</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP", { locale: de }) : "Datum wählen"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button 
              onClick={loadAndAnalyzeOrders} 
              disabled={loading || !dateFrom || !dateTo}
              className="ml-4"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analysiere...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Sicherheitscheck starten
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasAnalyzed && !loading && wrongOrders.length > 0 && (
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

      {hasAnalyzed && !loading && wrongOrders.length === 0 && (
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

      {hasAnalyzed && wrongOrders.length > 0 && (
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