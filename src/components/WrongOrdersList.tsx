import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as pdfjs from 'pdfjs-dist';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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

  const normalizeIban = (iban: string): string => {
    return iban.replace(/\s/g, '').toUpperCase();
  };

  const extractIbanFromPdf = async (pdfUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(pdfUrl);
      const arrayBuffer = await response.arrayBuffer();
      const pdf = await pdfjs.getDocument(arrayBuffer).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + ' ';
      }

      // Look for IBAN pattern
      const ibanRegex = /IBAN[:\s]*([A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}[A-Z0-9]{0,16})/gi;
      const matches = fullText.match(ibanRegex);
      
      if (matches && matches.length > 0) {
        // Extract just the IBAN part (remove "IBAN:" prefix)
        const ibanMatch = matches[0].replace(/IBAN[:\s]*/i, '');
        return normalizeIban(ibanMatch);
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting IBAN from PDF:', error);
      return null;
    }
  };

  const loadAndAnalyzeOrders = async () => {
    try {
      setLoading(true);
      
      // Load orders with invoice PDFs
      const { data: orders, error: ordersError } = await supabase
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
        .limit(100);

      if (ordersError) throw ordersError;
      
      // Load all bank accounts
      const { data: bankAccounts, error: bankError } = await supabase
        .from('bank_accounts')
        .select('id, account_name, iban');

      if (bankError) throw bankError;

      const bankAccountsMap = new Map<string, BankAccount>();
      bankAccounts?.forEach(account => {
        bankAccountsMap.set(account.id, account);
      });

      setTotalCount(orders?.length || 0);
      const discrepancies: WrongOrder[] = [];

      // Process each order
      if (orders) {
        for (let i = 0; i < orders.length; i++) {
          const order = orders[i];
          setProcessingCount(i + 1);

          const expectedBankAccount = bankAccountsMap.get(order.selected_bank_account_id);
          if (!expectedBankAccount) continue;

          const expectedIban = normalizeIban(expectedBankAccount.iban);
          
          try {
            const foundIban = await extractIbanFromPdf(order.invoice_pdf_url);
            
            if (foundIban && foundIban !== expectedIban) {
              discrepancies.push({
                order,
                expectedIban,
                foundIban,
                bankAccountName: expectedBankAccount.account_name
              });
            }
          } catch (error) {
            console.error(`Error processing order ${order.order_number}:`, error);
          }
        }
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