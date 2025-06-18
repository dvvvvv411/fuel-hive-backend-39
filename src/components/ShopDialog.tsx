
import { useState, useEffect, useRef } from 'react';
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
  const brandingFieldsRef = useRef<any>(null);
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
  });

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
      });
    }
  }, [shop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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

      // Save shop data
      if (shop) {
        const { error } = await supabase
          .from('shops')
          .update(finalFormData)
          .eq('id', shop.id);

        if (error) throw error;

        toast({
          title: 'Erfolg',
          description: 'Shop wurde erfolgreich aktualisiert',
        });
      } else {
        const { error } = await supabase
          .from('shops')
          .insert([finalFormData]);

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

          <BrandingFields 
            ref={brandingFieldsRef}
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
