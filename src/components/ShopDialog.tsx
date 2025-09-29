import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { BrandingFields } from './BrandingFields';

interface ShopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  shop?: any;
}

export function ShopDialog({ open, onOpenChange, onSuccess, shop }: ShopDialogProps) {
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [resendConfigs, setResendConfigs] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    company_email: '',
    company_phone: '',
    company_website: '',
    company_address: '',
    company_city: '',
    company_postcode: '',
    country_code: 'DE',
    currency: 'EUR',
    language: 'de',
    checkout_mode: 'manual',
    vat_number: '',
    court_name: '',
    business_owner: '',
    registration_number: '',
    vat_rate: 19,
    logo_url: '',
    accent_color: '#2563eb',
    support_phone: '',
    bank_account_id: null as string | null,
    resend_config_id: null as string | null,
  });

  useEffect(() => {
    if (open) {
      fetchBankAccounts();
      fetchResendConfigs();
    }
  }, [open]);

  const fetchBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('active', true)
        .eq('is_temporary', false) // Only show permanent bank accounts
        .order('account_name');

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Laden der Bankkonten',
        variant: 'destructive',
      });
    }
  };

  const fetchResendConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('resend_configs')
        .select('*')
        .eq('active', true)
        .order('config_name');

      if (error) throw error;
      setResendConfigs(data || []);
    } catch (error) {
      console.error('Error fetching resend configs:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Laden der Resend-Konfigurationen',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (shop) {
      setFormData({
        name: shop.name || '',
        company_name: shop.company_name || '',
        company_email: shop.company_email || '',
        company_phone: shop.company_phone || '',
        company_website: shop.company_website || '',
        company_address: shop.company_address || '',
        company_city: shop.company_city || '',
        company_postcode: shop.company_postcode || '',
        country_code: shop.country_code || 'DE',
        currency: shop.currency || 'EUR',
        language: shop.language || 'de',
        checkout_mode: shop.checkout_mode || 'manual',
        vat_number: shop.vat_number || '',
        court_name: shop.court_name || '',
        business_owner: shop.business_owner || '',
        registration_number: shop.registration_number || '',
        vat_rate: shop.vat_rate || 19,
        logo_url: shop.logo_url || '',
        accent_color: shop.accent_color || '#2563eb',
        support_phone: shop.support_phone || '',
        bank_account_id: shop.bank_account_id || null,
        resend_config_id: shop.resend_config_id || null,
      });
    } else {
      setFormData({
        name: '',
        company_name: '',
        company_email: '',
        company_phone: '',
        company_website: '',
        company_address: '',
        company_city: '',
        company_postcode: '',
        country_code: 'DE',
        currency: 'EUR',
        language: 'de',
        checkout_mode: 'manual',
        vat_number: '',
        court_name: '',
        business_owner: '',
        registration_number: '',
        vat_rate: 19,
        logo_url: '',
        accent_color: '#2563eb',
        support_phone: '',
        bank_account_id: null,
        resend_config_id: null,
      });
    }
  }, [shop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate that if checkout_mode is instant, a bank account must be selected
      if (formData.checkout_mode === 'instant' && !formData.bank_account_id) {
        toast({
          title: 'Validierungsfehler',
          description: 'Für den Sofort-Modus muss ein Bankkonto ausgewählt werden',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Check if there's a logo to upload via the global function
      let finalFormData = { ...formData };
      
      if ((window as any).uploadShopLogo) {
        console.log('Attempting to upload logo...');
        setLogoUploading(true);
        
        try {
          const logoUrl = await (window as any).uploadShopLogo();
          if (logoUrl) {
            finalFormData.logo_url = logoUrl;
            console.log('Logo uploaded successfully:', logoUrl);
            toast({
              title: 'Logo hochgeladen',
              description: 'Das Logo wurde erfolgreich hochgeladen',
            });
          }
        } catch (logoError) {
          console.error('Logo upload failed:', logoError);
          // Continue with shop creation/update even if logo upload fails
          toast({
            title: 'Logo-Upload fehlgeschlagen',
            description: 'Der Shop wird ohne Logo gespeichert',
            variant: 'destructive',
          });
        } finally {
          setLogoUploading(false);
        }
      }

      // Clean the data before saving - convert empty strings to null for UUID fields
      const cleanedData = {
        ...finalFormData,
        bank_account_id: finalFormData.bank_account_id || null,
        resend_config_id: finalFormData.resend_config_id || null,
      };

      console.log('Saving shop data:', cleanedData);

      // Save shop data
      if (shop) {
        const { error } = await supabase
          .from('shops')
          .update(cleanedData)
          .eq('id', shop.id);

        if (error) throw error;

        toast({
          title: 'Erfolg',
          description: 'Shop wurde erfolgreich aktualisiert',
        });
      } else {
        const { error } = await supabase
          .from('shops')
          .insert([cleanedData]);

        if (error) throw error;

        toast({
          title: 'Erfolg',
          description: 'Shop wurde erfolgreich erstellt',
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving shop:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Speichern des Shops',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setLogoUploading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (logoUrl: string) => {
    console.log('Logo uploaded callback:', logoUrl);
    setFormData(prev => ({ ...prev, logo_url: logoUrl }));
  };

  const isSubmitting = loading || logoUploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {shop ? 'Shop bearbeiten' : 'Neuen Shop erstellen'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Shop Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Mein Heizöl Shop"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_name">Firmenname</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Musterfirma GmbH"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_email">E-Mail</Label>
              <Input
                id="company_email"
                type="email"
                value={formData.company_email}
                onChange={(e) => handleInputChange('company_email', e.target.value)}
                placeholder="info@musterfirma.de"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_phone">Telefon</Label>
              <Input
                id="company_phone"
                value={formData.company_phone}
                onChange={(e) => handleInputChange('company_phone', e.target.value)}
                placeholder="+49 123 456789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_website">Website</Label>
              <Input
                id="company_website"
                value={formData.company_website}
                onChange={(e) => handleInputChange('company_website', e.target.value)}
                placeholder="https://www.musterfirma.de"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_address">Adresse</Label>
              <Input
                id="company_address"
                value={formData.company_address}
                onChange={(e) => handleInputChange('company_address', e.target.value)}
                placeholder="Musterstraße 123"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_city">Stadt</Label>
              <Input
                id="company_city"
                value={formData.company_city}
                onChange={(e) => handleInputChange('company_city', e.target.value)}
                placeholder="Musterstadt"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_postcode">Postleitzahl</Label>
              <Input
                id="company_postcode"
                value={formData.company_postcode}
                onChange={(e) => handleInputChange('company_postcode', e.target.value)}
                placeholder="12345"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country_code">Land</Label>
              <Select value={formData.country_code} onValueChange={(value) => handleInputChange('country_code', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DE">Deutschland</SelectItem>
                  <SelectItem value="AT">Österreich</SelectItem>
                  <SelectItem value="CH">Schweiz</SelectItem>
                  <SelectItem value="FR">Frankreich</SelectItem>
                  <SelectItem value="IT">Italien</SelectItem>
                  <SelectItem value="ES">Spanien</SelectItem>
                  <SelectItem value="PL">Polen</SelectItem>
                  <SelectItem value="NL">Niederlande</SelectItem>
                  <SelectItem value="BE">Belgien</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Währung</Label>
              <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                  <SelectItem value="CHF">Schweizer Franken (CHF)</SelectItem>
                  <SelectItem value="PLN">Polnischer Złoty (PLN)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Sprache</Label>
              <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="it">Italiano</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="pl">Polski</SelectItem>
                  <SelectItem value="nl">Nederlands</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkout_mode">Checkout-Modus</Label>
              <Select value={formData.checkout_mode} onValueChange={(value) => handleInputChange('checkout_mode', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manuell</SelectItem>
                  <SelectItem value="instant">Sofort</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Unternehmensdetails Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Unternehmensdetails</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vat_number">USt-IdNr (USTID)</Label>
                <Input
                  id="vat_number"
                  value={formData.vat_number}
                  onChange={(e) => handleInputChange('vat_number', e.target.value)}
                  placeholder="DE123456789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_owner">Geschäftsinhaber</Label>
                <Input
                  id="business_owner"
                  value={formData.business_owner}
                  onChange={(e) => handleInputChange('business_owner', e.target.value)}
                  placeholder="Max Mustermann"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="court_name">Amtsgericht</Label>
                <Input
                  id="court_name"
                  value={formData.court_name}
                  onChange={(e) => handleInputChange('court_name', e.target.value)}
                  placeholder="Amtsgericht Berlin"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration_number">Handelsregisternummer</Label>
                <Input
                  id="registration_number"
                  value={formData.registration_number}
                  onChange={(e) => handleInputChange('registration_number', e.target.value)}
                  placeholder="HRB 12345"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vat_rate">Mehrwertsteuersatz (%)</Label>
                <Input
                  id="vat_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.vat_rate || 19}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 19;
                    handleInputChange('vat_rate', Math.min(Math.max(value, 0), 100));
                  }}
                  placeholder="19"
                />
                <p className="text-xs text-muted-foreground">
                  Standard-Mehrwertsteuersatz in Deutschland: 19%
                </p>
              </div>
            </div>
          </div>

          {/* Email Configuration Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">E-Mail-Konfiguration</h3>
            <div className="space-y-2">
              <Label htmlFor="resend_config_id">Resend-Konfiguration</Label>
              <Select 
                value={formData.resend_config_id || ''} 
                onValueChange={(value) => handleInputChange('resend_config_id', value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Resend-Konfiguration auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {resendConfigs.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.config_name} - {config.from_email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {resendConfigs.length === 0 && (
                <p className="text-sm text-gray-500">
                  Keine aktiven Resend-Konfigurationen gefunden. Bitte erstellen Sie zuerst eine Resend-Konfiguration.
                </p>
              )}
              <p className="text-sm text-gray-600">
                Wählen Sie eine Resend-Konfiguration für den E-Mail-Versand dieses Shops.
              </p>
            </div>
          </div>

          {/* Bank Account Selection - Only show when checkout mode is instant */}
          {formData.checkout_mode === 'instant' && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Bankkonto-Einstellungen</h3>
              <div className="space-y-2">
                <Label htmlFor="bank_account_id">Bankkonto für Sofort-Checkout</Label>
                <Select 
                  value={formData.bank_account_id || ''} 
                  onValueChange={(value) => handleInputChange('bank_account_id', value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Bankkonto auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_name} - {account.iban}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {bankAccounts.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Keine aktiven permanenten Bankkonten gefunden. Bitte erstellen Sie zuerst ein Bankkonto.
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  Das ausgewählte Bankkonto wird bei Sofort-Bestellungen für die Überweisung angezeigt.
                </p>
              </div>
            </div>
          )}

          <BrandingFields 
            formData={formData}
            onInputChange={handleInputChange}
            onLogoUpload={handleLogoUpload}
          />

          {/* Loading State */}
          {logoUploading && (
            <div className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-800 font-medium">Logo wird hochgeladen...</span>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{logoUploading ? 'Logo wird hochgeladen...' : 'Speichern...'}</span>
                </div>
              ) : (
                shop ? 'Aktualisieren' : 'Erstellen'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
