import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getInvoiceTranslations } from '@/utils/invoiceTranslations';

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
  business_owner?: string;
  language: string;
  currency: string;
  vat_rate: number;
  accent_color?: string;
  support_phone?: string;
  logo_url?: string;
  bank_accounts?: {
    account_holder: string;
    iban: string;
    bic?: string;
    bank_name?: string;
    use_anyname?: boolean;
  };
}

const SUPPORTED_LANGUAGES = [
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'it', name: 'Italiano' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'pt', name: 'Português' },
  { code: 'pl', name: 'Polski' },
  { code: 'sv', name: 'Svenska' },
  { code: 'da', name: 'Dansk' },
  { code: 'no', name: 'Norsk' },
  { code: 'fi', name: 'Suomi' }
];

export function InvoicePreview() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [language, setLanguage] = useState('de');
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchShops();
  }, []);

  // Reset logo state when shop changes
  useEffect(() => {
    setLogoLoaded(false);
    setLogoError(false);
  }, [selectedShop?.id]);

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
          business_owner,
          language,
          currency,
          vat_rate,
          accent_color,
          support_phone,
          logo_url,
          bank_accounts(
            account_holder,
            iban,
            bic,
            bank_name,
            use_anyname
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

  const t = getInvoiceTranslations(language);

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
    deliveryCity: 'Musterstadt',
    billingStreet: 'Rechnungsstraße 456',
    billingPostcode: '54321',
    billingCity: 'Rechnungsstadt'
  };

  const vatRate = selectedShop?.vat_rate || 19;
  const totalAmount = sampleData.basePrice + sampleData.deliveryFee;
  const totalWithoutVat = totalAmount / (1 + vatRate / 100);
  const vatAmount = totalAmount - totalWithoutVat;

  const currentDate = new Date();

  const accentColor = selectedShop?.accent_color || '#2563eb';
  
  // Check if addresses are different for preview
  const hasDifferentAddresses = sampleData.billingStreet !== sampleData.deliveryStreet;

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
      // Create a sample order for PDF generation with correct field names
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          shop_id: selectedShop.id,
          order_number: sampleData.orderNumber,
          customer_name: sampleData.customerName,
          customer_email: 'sample@example.com',
          customer_phone: '+49123456789',
          delivery_first_name: 'Max',
          delivery_last_name: 'Mustermann',
          delivery_street: sampleData.deliveryStreet,
          delivery_postcode: sampleData.deliveryPostcode,
          delivery_city: sampleData.deliveryCity,
          liters: sampleData.liters,
          price_per_liter: sampleData.pricePerLiter,
          base_price: sampleData.basePrice,
          delivery_fee: sampleData.deliveryFee,
          amount: totalAmount,
          total_amount: totalAmount,
          status: 'completed',
          processing_mode: 'manual',
          payment_method: 'bank_transfer',
          product: 'heating_oil'
        })
        .select()
        .single();

      if (error) throw error;

      // Generate PDF with the selected language
      const { data, error: invoiceError } = await supabase.functions.invoke('generate-invoice', {
        body: { 
          order_id: order.id,
          language: language // Pass the selected language
        }
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
        description: `Sample PDF generated successfully in ${SUPPORTED_LANGUAGES.find(l => l.code === language)?.name}`,
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

  const handleLogoLoad = () => {
    setLogoLoaded(true);
    setLogoError(false);
  };

  const handleLogoError = () => {
    setLogoError(true);
    setLogoLoaded(false);
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
            
            <div className="min-w-48">
              <label className="block text-sm font-medium mb-2">Preview Language</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
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
            
            {/* Modern Header */}
            <div className="flex items-start mb-12">
              {/* Logo section - doubled size from w-20 h-16 to w-40 h-32 */}
              <div className="w-40 h-32 mr-6 flex items-center justify-center">
                {selectedShop.logo_url ? (
                  <div className="relative w-full h-full">
                    {/* Loading placeholder shown while image loads */}
                    {!logoLoaded && !logoError && (
                      <div className="absolute inset-0 bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center animate-pulse">
                        <span className="text-sm text-gray-500">Loading...</span>
                      </div>
                    )}
                    
                    {/* Actual logo */}
                    <img
                      src={selectedShop.logo_url}
                      alt={`${selectedShop.company_name} Logo`}
                      className={`w-full h-full object-contain ${logoLoaded ? 'block' : 'hidden'}`}
                      onLoad={handleLogoLoad}
                      onError={handleLogoError}
                    />
                    
                    {/* Error fallback */}
                    {logoError && (
                      <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <span className="text-sm text-gray-500">LOGO</span>
                      </div>
                    )}
                  </div>
                ) : (
                  // No logo URL - show placeholder
                  <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-sm text-gray-500">LOGO</span>
                  </div>
                )}
              </div>
              
              {/* Company details */}
              <div>
                <h1 className="text-xl font-bold mb-2" style={{ color: accentColor }}>{selectedShop.company_name}</h1>
                <div className="text-gray-600 text-xs space-y-1">
                  <div>{selectedShop.company_address}</div>
                  <div>{selectedShop.company_postcode} {selectedShop.company_city}</div>
                  {selectedShop.company_phone && <div>{t.phone || 'Phone'}: {selectedShop.company_phone}</div>}
                  <div>{t.email || 'Email'}: {selectedShop.company_email}</div>
                  {selectedShop.company_website && <div>{t.website || 'Website'}: {selectedShop.company_website}</div>}
                  {selectedShop.vat_number && <div>USt-IdNr: {selectedShop.vat_number}</div>}
                </div>
              </div>
            </div>

            {/* Invoice Title */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold" style={{ color: accentColor }}>{t.invoice}</h2>
            </div>

            {/* Two-column layout for addresses and invoice details */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Left column - Addresses */}
              <div className="space-y-6">
                {/* Billing Address */}
                {hasDifferentAddresses && (
                  <div>
                    <h3 className="font-medium mb-2" style={{ color: accentColor }}>{t.billingAddress}</h3>
                    <div className="text-sm">
                      <div className="font-medium">{sampleData.customerName}</div>
                      <div>{sampleData.billingStreet}</div>
                      <div>{sampleData.billingPostcode} {sampleData.billingCity}</div>
                    </div>
                  </div>
                )}
                
                {/* Delivery Address */}
                <div>
                  {hasDifferentAddresses && <h3 className="font-medium mb-2" style={{ color: accentColor }}>{t.deliveryAddress}</h3>}
                  <div className="text-sm">
                    <div className="font-medium">{sampleData.customerName}</div>
                    <div>{sampleData.deliveryStreet}</div>
                    <div>{sampleData.deliveryPostcode} {sampleData.deliveryCity}</div>
                  </div>
                </div>
              </div>

              {/* Right column - Invoice details (reduced fields) */}
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="w-32 font-medium">{t.invoiceDate}:</span>
                  <span>{currentDate.toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE')}</span>
                </div>
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

            {/* Items Table with modern styling */}
            <div className="mb-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: accentColor }}>
                    <th className="p-3 text-left text-white text-sm">{t.description}</th>
                    <th className="p-3 text-center text-white text-sm">{t.quantity}</th>
                    <th className="p-3 text-right text-white text-sm">{t.unitPrice}</th>
                    <th className="p-3 text-right text-white text-sm">{t.total}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50">
                    <td className="p-3 text-sm">{t.heatingOilDelivery}</td>
                    <td className="p-3 text-center text-sm">{sampleData.liters} {t.liters}</td>
                    <td className="p-3 text-right text-sm">{t.currency}{sampleData.pricePerLiter.toFixed(3)}</td>
                    <td className="p-3 text-right text-sm">{t.currency}{sampleData.basePrice.toFixed(2)}</td>
                  </tr>
                  {sampleData.deliveryFee > 0 && (
                    <tr>
                      <td className="p-3 text-sm">{t.deliveryFee}</td>
                      <td className="p-3 text-center text-sm">1</td>
                      <td className="p-3 text-right text-sm">{t.currency}{sampleData.deliveryFee.toFixed(2)}</td>
                      <td className="p-3 text-right text-sm">{t.currency}{sampleData.deliveryFee.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-64 bg-gray-50 border rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t.subtotal}:</span>
                  <span>{t.currency}{totalWithoutVat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t.vat} ({vatRate}%):</span>
                  <span>{t.currency}{vatAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t" style={{ color: accentColor }}>
                  <span>{t.grandTotal}:</span>
                  <span>{t.currency}{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Details Card */}
            {selectedShop.bank_accounts && (
              <div className="mb-8">
                <div className="border rounded-lg overflow-hidden">
                  <div className="p-3 text-white text-lg font-bold" style={{ backgroundColor: accentColor }}>
                    {t.paymentDetails}
                  </div>
                  <div className="bg-gray-50 p-4 space-y-2 text-sm">
                    <div className="flex">
                      <span className="w-32 font-medium">{t.accountHolder}:</span>
                      <span>{selectedShop.bank_accounts.use_anyname ? selectedShop.name : selectedShop.bank_accounts.account_holder}</span>
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
                      <span>{sampleData.orderNumber}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modern 4-column Footer */}
            <div className="mt-16 pt-4 bg-gray-50 -mx-8 px-8 pb-4">
              <div className="grid grid-cols-4 gap-6 text-xs text-gray-600">
                {/* Column 1: Company name and address */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">{selectedShop.company_name}</h4>
                  <div>{selectedShop.company_address}</div>
                  <div>{selectedShop.company_postcode} {selectedShop.company_city}</div>
                </div>
                
                {/* Column 2: Contact information */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">Kontakt</h4>
                  {selectedShop.company_phone && <div>Tel.: {selectedShop.company_phone}</div>}
                  <div>Email: {selectedShop.company_email}</div>
                  {selectedShop.company_website && <div>Website: {selectedShop.company_website}</div>}
                </div>
                
                {/* Column 3: Bank information */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">Bankinformationen</h4>
                  {selectedShop.bank_accounts && (
                    <>
                      <div>Kontoinhaber: {selectedShop.bank_accounts.use_anyname ? selectedShop.name : selectedShop.bank_accounts.account_holder}</div>
                      <div>IBAN: {selectedShop.bank_accounts.iban}</div>
                      {selectedShop.bank_accounts.bic && <div>BIC: {selectedShop.bank_accounts.bic}</div>}
                    </>
                  )}
                </div>
                
                {/* Column 4: Business owner and VAT ID */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">Geschäftsdaten</h4>
                  {selectedShop.business_owner && <div>Geschäftsinhaber: {selectedShop.business_owner}</div>}
                  {selectedShop.vat_number && <div>USt-IdNr: {selectedShop.vat_number}</div>}
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
