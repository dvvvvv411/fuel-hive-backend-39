
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Shop {
  id: string;
  name: string;
  company_name: string;
  company_address: string;
  company_postcode: string;
  company_city: string;
  company_phone?: string;
  company_email: string;
  company_website?: string;
  vat_number?: string;
  language: string;
  currency: string;
  vat_rate: number;
  bank_accounts?: {
    account_holder: string;
    iban: string;
    bic?: string;
    bank_name?: string;
  };
}

export function InvoicePreview() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [language, setLanguage] = useState('de');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select(`
          id,
          name,
          company_name,
          company_address,
          company_postcode,
          company_city,
          company_phone,
          company_email,
          company_website,
          vat_number,
          language,
          currency,
          vat_rate,
          bank_accounts(
            account_holder,
            iban,
            bic,
            bank_name
          )
        `);

      if (error) throw error;
      setShops(data || []);
      if (data && data.length > 0) {
        setSelectedShop(data[0]);
        setLanguage(data[0].language || 'de');
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast({
        title: "Error",
        description: "Failed to load shops",
        variant: "destructive",
      });
    }
  };

  const getTranslations = (lang: string) => {
    const translations = {
      de: {
        invoice: 'Rechnung',
        invoiceNumber: 'Rechnungsnummer',
        invoiceDate: 'Rechnungsdatum',
        dueDate: 'Fälligkeitsdatum',
        orderNumber: 'Bestellnummer',
        orderDate: 'Bestelldatum',
        description: 'Beschreibung',
        quantity: 'Menge',
        unitPrice: 'Einzelpreis',
        total: 'Gesamt',
        heatingOilDelivery: 'Heizöllieferung',
        liters: 'Liter',
        deliveryFee: 'Liefergebühr',
        subtotal: 'Zwischensumme',
        vat: 'MwSt.',
        grandTotal: 'Gesamtsumme',
        paymentDetails: 'Zahlungsdetails',
        accountHolder: 'Kontoinhaber',
        iban: 'IBAN',
        bic: 'BIC',
        paymentReference: 'Verwendungszweck',
        dueDays: '14 Tage netto',
        thankYou: 'Vielen Dank für Ihr Vertrauen!',
        currency: '€'
      },
      en: {
        invoice: 'Invoice',
        invoiceNumber: 'Invoice Number',
        invoiceDate: 'Invoice Date',
        dueDate: 'Due Date',
        orderNumber: 'Order Number',
        orderDate: 'Order Date',
        description: 'Description',
        quantity: 'Quantity',
        unitPrice: 'Unit Price',
        total: 'Total',
        heatingOilDelivery: 'Heating Oil Delivery',
        liters: 'Liters',
        deliveryFee: 'Delivery Fee',
        subtotal: 'Subtotal',
        vat: 'VAT',
        grandTotal: 'Grand Total',
        paymentDetails: 'Payment Details',
        accountHolder: 'Account Holder',
        iban: 'IBAN',
        bic: 'BIC',
        paymentReference: 'Payment Reference',
        dueDays: '14 days net',
        thankYou: 'Thank you for your trust!',
        currency: '£'
      },
      fr: {
        invoice: 'Facture',
        invoiceNumber: 'Numéro de facture',
        invoiceDate: 'Date de facturation',
        dueDate: 'Date d\'échéance',
        orderNumber: 'Numéro de commande',
        orderDate: 'Date de commande',
        description: 'Description',
        quantity: 'Quantité',
        unitPrice: 'Prix unitaire',
        total: 'Total',
        heatingOilDelivery: 'Livraison de mazout',
        liters: 'Litres',
        deliveryFee: 'Frais de livraison',
        subtotal: 'Sous-total',
        vat: 'TVA',
        grandTotal: 'Total général',
        paymentDetails: 'Détails de paiement',
        accountHolder: 'Titulaire du compte',
        iban: 'IBAN',
        bic: 'BIC',
        paymentReference: 'Référence de paiement',
        dueDays: '14 jours net',
        thankYou: 'Merci pour votre confiance!',
        currency: '€'
      }
    };
    return translations[lang as keyof typeof translations] || translations.de;
  };

  const t = getTranslations(language);

  // Sample data for preview
  const sampleData = {
    invoiceNumber: '2025-0001',
    orderNumber: '1234567',
    liters: 1000,
    pricePerLiter: 0.85,
    basePrice: 850.00,
    deliveryFee: 25.00,
    customerName: 'Max Mustermann',
    deliveryStreet: 'Musterstraße 123',
    deliveryPostcode: '12345',
    deliveryCity: 'Musterstadt'
  };

  const vatRate = selectedShop?.vat_rate || 19;
  const totalAmount = sampleData.basePrice + sampleData.deliveryFee;
  const totalWithoutVat = totalAmount / (1 + vatRate / 100);
  const vatAmount = totalAmount - totalWithoutVat;

  const currentDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  const handleGeneratePDF = async () => {
    if (!selectedShop) {
      toast({
        title: "Error",
        description: "Please select a shop first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Create a sample order for PDF generation
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          shop_id: selectedShop.id,
          customer_name: sampleData.customerName,
          customer_email: 'sample@example.com',
          customer_phone: '+49123456789',
          delivery_street: sampleData.deliveryStreet,
          delivery_postcode: sampleData.deliveryPostcode,
          delivery_city: sampleData.deliveryCity,
          liters: sampleData.liters,
          price_per_liter: sampleData.pricePerLiter,
          base_price: sampleData.basePrice,
          delivery_fee: sampleData.deliveryFee,
          total_amount: totalAmount,
          status: 'completed',
          processing_mode: 'manual'
        })
        .select()
        .single();

      if (error) throw error;

      // Generate PDF
      const { data, error: invoiceError } = await supabase.functions.invoke('generate-invoice', {
        body: { order_id: order.id }
      });

      if (invoiceError) throw invoiceError;

      // Open PDF in new tab
      if (data.invoice_url) {
        window.open(data.invoice_url, '_blank');
      }

      // Clean up the sample order
      await supabase.from('orders').delete().eq('id', order.id);

      toast({
        title: "Success",
        description: "Sample PDF generated successfully",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!selectedShop) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading shops...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Template Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium mb-2">Shop</label>
              <Select
                value={selectedShop.id}
                onValueChange={(value) => {
                  const shop = shops.find(s => s.id === value);
                  if (shop) {
                    setSelectedShop(shop);
                    setLanguage(shop.language || 'de');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((shop) => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="min-w-32">
              <label className="block text-sm font-medium mb-2">Language</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate PDF'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Preview */}
      <Card>
        <CardContent className="p-0">
          <div className="invoice-preview bg-white p-8 font-sans text-sm leading-relaxed" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', boxShadow: '0 0 20px rgba(0,0,0,0.1)' }}>
            
            {/* Company Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-blue-600 mb-3">{selectedShop.company_name}</h1>
              <div className="text-gray-600 text-sm space-y-1">
                <div>{selectedShop.company_address}</div>
                <div>{selectedShop.company_postcode} {selectedShop.company_city}</div>
                {selectedShop.company_phone && <div>Tel: {selectedShop.company_phone}</div>}
                <div>E-Mail: {selectedShop.company_email}</div>
                {selectedShop.company_website && <div>Web: {selectedShop.company_website}</div>}
                {selectedShop.vat_number && <div>USt-IdNr: {selectedShop.vat_number}</div>}
              </div>
            </div>

            {/* Customer Address */}
            <div className="flex justify-between mb-12">
              <div className="w-1/2"></div>
              <div className="w-1/2 text-right">
                <div className="font-medium">{sampleData.customerName}</div>
                <div>{sampleData.deliveryStreet}</div>
                <div>{sampleData.deliveryPostcode} {sampleData.deliveryCity}</div>
              </div>
            </div>

            {/* Invoice Title */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-blue-600">{t.invoice}</h2>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-32 font-medium">{t.invoiceNumber}:</span>
                  <span>{sampleData.invoiceNumber}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-medium">{t.invoiceDate}:</span>
                  <span>{currentDate.toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE')}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-medium">{t.dueDate}:</span>
                  <span>{dueDate.toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE')}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-32 font-medium">{t.orderNumber}:</span>
                  <span>{sampleData.orderNumber}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-medium">{t.orderDate}:</span>
                  <span>{currentDate.toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE')}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="border border-gray-300 p-3 text-left">{t.description}</th>
                    <th className="border border-gray-300 p-3 text-center">{t.quantity}</th>
                    <th className="border border-gray-300 p-3 text-right">{t.unitPrice}</th>
                    <th className="border border-gray-300 p-3 text-right">{t.total}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-3">{t.heatingOilDelivery}</td>
                    <td className="border border-gray-300 p-3 text-center">{sampleData.liters} {t.liters}</td>
                    <td className="border border-gray-300 p-3 text-right">{t.currency}{sampleData.pricePerLiter.toFixed(3)}</td>
                    <td className="border border-gray-300 p-3 text-right">{t.currency}{sampleData.basePrice.toFixed(2)}</td>
                  </tr>
                  {sampleData.deliveryFee > 0 && (
                    <tr>
                      <td className="border border-gray-300 p-3">{t.deliveryFee}</td>
                      <td className="border border-gray-300 p-3 text-center">1</td>
                      <td className="border border-gray-300 p-3 text-right">{t.currency}{sampleData.deliveryFee.toFixed(2)}</td>
                      <td className="border border-gray-300 p-3 text-right">{t.currency}{sampleData.deliveryFee.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>{t.subtotal}:</span>
                  <span>{t.currency}{totalWithoutVat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.vat} ({vatRate}%):</span>
                  <span>{t.currency}{vatAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-blue-600 border-t pt-2">
                  <span>{t.grandTotal}:</span>
                  <span>{t.currency}{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            {selectedShop.bank_accounts && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-blue-600 mb-4">{t.paymentDetails}</h3>
                <div className="space-y-2">
                  <div className="flex">
                    <span className="w-32 font-medium">{t.accountHolder}:</span>
                    <span>{selectedShop.bank_accounts.account_holder}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-medium">{t.iban}:</span>
                    <span>{selectedShop.bank_accounts.iban}</span>
                  </div>
                  {selectedShop.bank_accounts.bic && (
                    <div className="flex">
                      <span className="w-32 font-medium">{t.bic}:</span>
                      <span>{selectedShop.bank_accounts.bic}</span>
                    </div>
                  )}
                  <div className="flex">
                    <span className="w-32 font-medium">{t.paymentReference}:</span>
                    <span>{sampleData.invoiceNumber}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-medium">Zahlungsziel:</span>
                    <span>{t.dueDays}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-4 text-gray-600 text-center">
              {t.thankYou}
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
