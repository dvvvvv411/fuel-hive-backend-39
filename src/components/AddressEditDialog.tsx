import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, FileText, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Order {
  id: string;
  delivery_company_name: string | null;
  delivery_first_name: string;
  delivery_last_name: string;
  delivery_street: string;
  delivery_postcode: string;
  delivery_city: string;
  delivery_phone: string | null;
  billing_company_name: string | null;
  billing_first_name: string | null;
  billing_last_name: string | null;
  billing_street: string | null;
  billing_postcode: string | null;
  billing_city: string | null;
  use_same_address: boolean;
}

interface AddressEditDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function AddressEditDialog({ order, open, onOpenChange, onSave }: AddressEditDialogProps) {
  const [saving, setSaving] = useState(false);
  
  const [deliveryForm, setDeliveryForm] = useState({
    delivery_company_name: order.delivery_company_name || '',
    delivery_first_name: order.delivery_first_name,
    delivery_last_name: order.delivery_last_name,
    delivery_street: order.delivery_street,
    delivery_postcode: order.delivery_postcode,
    delivery_city: order.delivery_city,
    delivery_phone: order.delivery_phone || '',
  });

  const [billingForm, setBillingForm] = useState({
    billing_company_name: order.billing_company_name || '',
    billing_first_name: order.billing_first_name || '',
    billing_last_name: order.billing_last_name || '',
    billing_street: order.billing_street || '',
    billing_postcode: order.billing_postcode || '',
    billing_city: order.billing_city || '',
  });

  const hasBillingAddress = !order.use_same_address && order.billing_street;

  // Reset form when order changes
  useEffect(() => {
    setDeliveryForm({
      delivery_company_name: order.delivery_company_name || '',
      delivery_first_name: order.delivery_first_name,
      delivery_last_name: order.delivery_last_name,
      delivery_street: order.delivery_street,
      delivery_postcode: order.delivery_postcode,
      delivery_city: order.delivery_city,
      delivery_phone: order.delivery_phone || '',
    });
    setBillingForm({
      billing_company_name: order.billing_company_name || '',
      billing_first_name: order.billing_first_name || '',
      billing_last_name: order.billing_last_name || '',
      billing_street: order.billing_street || '',
      billing_postcode: order.billing_postcode || '',
      billing_city: order.billing_city || '',
    });
  }, [order]);

  const handleSave = async () => {
    try {
      setSaving(true);

      const updateData: Record<string, string | null> = {
        ...deliveryForm,
        delivery_company_name: deliveryForm.delivery_company_name || null,
        delivery_phone: deliveryForm.delivery_phone || null,
      };

      // Only include billing if there's a separate billing address
      if (hasBillingAddress) {
        updateData.billing_company_name = billingForm.billing_company_name || null;
        updateData.billing_first_name = billingForm.billing_first_name || null;
        updateData.billing_last_name = billingForm.billing_last_name || null;
        updateData.billing_street = billingForm.billing_street || null;
        updateData.billing_postcode = billingForm.billing_postcode || null;
        updateData.billing_city = billingForm.billing_city || null;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: 'Erfolg',
        description: 'Adresse wurde aktualisiert',
      });

      onSave();
    } catch (error) {
      console.error('Error updating address:', error);
      toast({
        title: 'Fehler',
        description: 'Adresse konnte nicht aktualisiert werden',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Adresse bearbeiten
          </DialogTitle>
          <DialogDescription>
            Bearbeiten Sie die Liefer- und Rechnungsadresse der Bestellung
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Delivery Address */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Lieferadresse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="delivery_company">Firma (optional)</Label>
                  <Input
                    id="delivery_company"
                    value={deliveryForm.delivery_company_name}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, delivery_company_name: e.target.value })}
                    placeholder="Firmenname"
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_first_name">Vorname</Label>
                  <Input
                    id="delivery_first_name"
                    value={deliveryForm.delivery_first_name}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, delivery_first_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_last_name">Nachname</Label>
                  <Input
                    id="delivery_last_name"
                    value={deliveryForm.delivery_last_name}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, delivery_last_name: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="delivery_street">Straße & Hausnummer</Label>
                  <Input
                    id="delivery_street"
                    value={deliveryForm.delivery_street}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, delivery_street: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_postcode">PLZ</Label>
                  <Input
                    id="delivery_postcode"
                    value={deliveryForm.delivery_postcode}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, delivery_postcode: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_city">Stadt</Label>
                  <Input
                    id="delivery_city"
                    value={deliveryForm.delivery_city}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, delivery_city: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="delivery_phone">Telefon (optional)</Label>
                  <Input
                    id="delivery_phone"
                    value={deliveryForm.delivery_phone}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, delivery_phone: e.target.value })}
                    placeholder="Telefonnummer"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Address (if different) */}
          {hasBillingAddress && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Rechnungsadresse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="billing_company">Firma (optional)</Label>
                    <Input
                      id="billing_company"
                      value={billingForm.billing_company_name}
                      onChange={(e) => setBillingForm({ ...billingForm, billing_company_name: e.target.value })}
                      placeholder="Firmenname"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing_first_name">Vorname</Label>
                    <Input
                      id="billing_first_name"
                      value={billingForm.billing_first_name}
                      onChange={(e) => setBillingForm({ ...billingForm, billing_first_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing_last_name">Nachname</Label>
                    <Input
                      id="billing_last_name"
                      value={billingForm.billing_last_name}
                      onChange={(e) => setBillingForm({ ...billingForm, billing_last_name: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="billing_street">Straße & Hausnummer</Label>
                    <Input
                      id="billing_street"
                      value={billingForm.billing_street}
                      onChange={(e) => setBillingForm({ ...billingForm, billing_street: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing_postcode">PLZ</Label>
                    <Input
                      id="billing_postcode"
                      value={billingForm.billing_postcode}
                      onChange={(e) => setBillingForm({ ...billingForm, billing_postcode: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing_city">Stadt</Label>
                    <Input
                      id="billing_city"
                      value={billingForm.billing_city}
                      onChange={(e) => setBillingForm({ ...billingForm, billing_city: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
