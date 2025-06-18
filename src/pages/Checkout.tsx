
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Banknote, CheckCircle } from 'lucide-react';

interface ShopConfig {
  shop: {
    id: string;
    name: string;
    company_name: string;
    checkout_mode: string;
    currency: string;
    logo_url?: string;
    accent_color?: string;
  };
  payment_methods: Array<{
    id: string;
    name: string;
    code: string;
    description?: string;
  }>;
}

interface TokenData {
  token: string;
  shop_id: string;
  product: string;
  liters: number;
  price_per_liter: number;
  delivery_fee: number;
  total_amount: number;
  vat_rate: number;
  vat_amount: number;
  shop: {
    company_name: string;
    currency: string;
  };
}

interface BankData {
  shop_name: string;
  bank_data: {
    account_name: string;
    account_holder: string;
    bank_name: string;
    iban: string;
    bic: string;
    currency: string;
  };
}

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [shopConfig, setShopConfig] = useState<ShopConfig | null>(null);
  const [bankData, setBankData] = useState<BankData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    delivery_street: '',
    delivery_postal_code: '',
    delivery_city: '',
    payment_method_id: '',
    terms_accepted: false,
  });

  useEffect(() => {
    if (token) {
      fetchTokenData();
    } else {
      setLoading(false);
      toast({
        title: 'Fehler',
        description: 'Kein gültiger Token gefunden',
        variant: 'destructive',
      });
    }
  }, [token]);

  const fetchTokenData = async () => {
    try {
      // Get token data
      const tokenResponse = await supabase.functions.invoke('get-order-token', {
        body: null,
        headers: {},
      }, {
        method: 'GET',
        query: { token: token! }
      });

      if (tokenResponse.error) {
        throw new Error(tokenResponse.error.message);
      }

      const tokenData = tokenResponse.data;
      setTokenData(tokenData);

      // Get shop configuration
      const configResponse = await supabase.functions.invoke('get-shop-config', {
        body: null,
        headers: {},
      }, {
        method: 'GET',
        query: { shop_id: tokenData.shop_id }
      });

      if (configResponse.error) {
        throw new Error(configResponse.error.message);
      }

      const config = configResponse.data;
      setShopConfig(config);

      // If checkout mode is instant, get bank data
      if (config.shop.checkout_mode === 'instant') {
        const bankResponse = await supabase.functions.invoke('get-shop-bankdata', {
          body: null,
          headers: {},
        }, {
          method: 'GET',
          query: { shop_id: tokenData.shop_id }
        });

        if (bankResponse.error) {
          console.error('Bank data error:', bankResponse.error);
          // Don't fail the whole process if bank data is not available
        } else {
          setBankData(bankResponse.data);
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Laden der Bestelldaten',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.terms_accepted) {
      toast({
        title: 'AGB nicht akzeptiert',
        description: 'Bitte akzeptieren Sie die Allgemeinen Geschäftsbedingungen',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const orderData = {
        token: token,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        delivery_street: formData.delivery_street,
        delivery_postal_code: formData.delivery_postal_code,
        delivery_city: formData.delivery_city,
        payment_method_id: formData.payment_method_id,
        terms_accepted: formData.terms_accepted,
      };

      const response = await supabase.functions.invoke('create-order', {
        body: orderData
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Show success message
      toast({
        title: 'Bestellung erfolgreich!',
        description: `Ihre Bestellung ${response.data.order_number} wurde erfolgreich aufgegeben.`,
      });

      // Reset form
      setFormData({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        delivery_street: '',
        delivery_postal_code: '',
        delivery_city: '',
        payment_method_id: '',
        terms_accepted: false,
      });

    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Aufgeben der Bestellung',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!tokenData || !shopConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Bestellung nicht gefunden</h2>
              <p className="text-gray-600">Der angegebene Token ist ungültig oder abgelaufen.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          {shopConfig.shop.logo_url && (
            <img 
              src={shopConfig.shop.logo_url} 
              alt={shopConfig.shop.name}
              className="h-16 mx-auto mb-4"
            />
          )}
          <h1 className="text-3xl font-bold text-gray-900">{shopConfig.shop.company_name}</h1>
          <p className="text-gray-600 mt-2">Bestellung abschließen</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Bestellübersicht</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">{tokenData.product}</span>
                <span>{tokenData.liters} Liter</span>
              </div>
              <div className="flex justify-between">
                <span>Preis pro Liter</span>
                <span>{tokenData.price_per_liter.toFixed(2)} {tokenData.shop.currency}</span>
              </div>
              <div className="flex justify-between">
                <span>Liefergebühr</span>
                <span>{tokenData.delivery_fee.toFixed(2)} {tokenData.shop.currency}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Gesamtbetrag</span>
                <span>{tokenData.total_amount.toFixed(2)} {tokenData.shop.currency}</span>
              </div>
              {tokenData.vat_amount > 0 && (
                <p className="text-sm text-gray-600">
                  inkl. {tokenData.vat_rate}% MwSt. ({tokenData.vat_amount.toFixed(2)} {tokenData.shop.currency})
                </p>
              )}
            </CardContent>
          </Card>

          {/* Order Form */}
          <Card>
            <CardHeader>
              <CardTitle>Bestelldaten</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Name *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => handleInputChange('customer_name', e.target.value)}
                    placeholder="Max Mustermann"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_email">E-Mail *</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => handleInputChange('customer_email', e.target.value)}
                    placeholder="max@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_phone">Telefon</Label>
                  <Input
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                    placeholder="+49 123 456789"
                  />
                </div>

                <Separator />

                <h3 className="text-lg font-semibold">Lieferadresse</h3>

                <div className="space-y-2">
                  <Label htmlFor="delivery_street">Straße und Hausnummer *</Label>
                  <Input
                    id="delivery_street"
                    value={formData.delivery_street}
                    onChange={(e) => handleInputChange('delivery_street', e.target.value)}
                    placeholder="Musterstraße 123"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="delivery_postal_code">PLZ *</Label>
                    <Input
                      id="delivery_postal_code"
                      value={formData.delivery_postal_code}
                      onChange={(e) => handleInputChange('delivery_postal_code', e.target.value)}
                      placeholder="12345"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery_city">Stadt *</Label>
                    <Input
                      id="delivery_city"
                      value={formData.delivery_city}
                      onChange={(e) => handleInputChange('delivery_city', e.target.value)}
                      placeholder="Musterstadt"
                      required
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="payment_method_id">Zahlungsart *</Label>
                  <Select 
                    value={formData.payment_method_id} 
                    onValueChange={(value) => handleInputChange('payment_method_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Zahlungsart wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {shopConfig.payment_methods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center gap-2">
                            {method.code === 'bank_transfer' ? <Banknote className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                            {method.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.terms_accepted}
                    onCheckedChange={(checked) => handleInputChange('terms_accepted', checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    Ich akzeptiere die Allgemeinen Geschäftsbedingungen *
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitting}
                  style={{ backgroundColor: shopConfig.shop.accent_color }}
                >
                  {submitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Bestellung wird aufgegeben...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Bestellung aufgeben</span>
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Bank Details for Instant Checkout */}
        {shopConfig.shop.checkout_mode === 'instant' && bankData && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Bankverbindung für Überweisung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-blue-800 font-medium mb-4">
                  Bitte überweisen Sie den Betrag an folgende Bankverbindung:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Empfänger</p>
                    <p className="text-gray-900">{bankData.bank_data.account_holder}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Bank</p>
                    <p className="text-gray-900">{bankData.bank_data.bank_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">IBAN</p>
                    <p className="text-gray-900 font-mono">{bankData.bank_data.iban}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">BIC</p>
                    <p className="text-gray-900 font-mono">{bankData.bank_data.bic}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700">Betrag</p>
                    <p className="text-xl font-bold text-gray-900">
                      {tokenData.total_amount.toFixed(2)} {bankData.bank_data.currency}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-blue-700 mt-4">
                  Nach Ihrer Bestellung erhalten Sie eine Rechnung mit der Bestellnummer als Verwendungszweck.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Checkout;
