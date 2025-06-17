
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

const shopFormSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  company_name: z.string().min(1, 'Firmenname ist erforderlich'),
  company_email: z.string().email('Gültige E-Mail-Adresse erforderlich'),
  company_phone: z.string().optional(),
  company_website: z.string().url('Gültige URL erforderlich').optional().or(z.literal('')),
  company_address: z.string().min(1, 'Adresse ist erforderlich'),
  company_city: z.string().min(1, 'Stadt ist erforderlich'),
  company_postcode: z.string().min(1, 'Postleitzahl ist erforderlich'),
  country_code: z.string().min(1, 'Ländercode ist erforderlich'),
  currency: z.string().min(1, 'Währung ist erforderlich'),
  language: z.string().min(1, 'Sprache ist erforderlich'),
  checkout_mode: z.string().min(1, 'Checkout-Modus ist erforderlich'),
  vat_number: z.string().optional(),
  court_name: z.string().optional(),
  business_owner: z.string().optional(),
  registration_number: z.string().optional(),
  active: z.boolean(),
  bank_account_id: z.string().optional(),
  resend_config_id: z.string().optional(),
});

type ShopFormValues = z.infer<typeof shopFormSchema>;

interface ShopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shop?: any;
  onSuccess: () => void;
}

interface BankAccount {
  id: string;
  account_name: string;
  bank_name: string;
  active: boolean;
}

interface ResendConfig {
  id: string;
  config_name: string;
  active: boolean;
}

export function ShopDialog({ open, onOpenChange, shop, onSuccess }: ShopDialogProps) {
  const [loading, setLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [resendConfigs, setResendConfigs] = useState<ResendConfig[]>([]);

  const isEditing = !!shop;

  const form = useForm<ShopFormValues>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: {
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
      checkout_mode: 'standard',
      vat_number: '',
      court_name: '',
      business_owner: '',
      registration_number: '',
      active: true,
      bank_account_id: '',
      resend_config_id: '',
    },
  });

  useEffect(() => {
    if (open) {
      fetchBankAccounts();
      fetchResendConfigs();
      
      if (shop) {
        form.reset({
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
          checkout_mode: shop.checkout_mode || 'standard',
          vat_number: shop.vat_number || '',
          court_name: shop.court_name || '',
          business_owner: shop.business_owner || '',
          registration_number: shop.registration_number || '',
          active: shop.active ?? true,
          bank_account_id: shop.bank_account_id || '',
          resend_config_id: shop.resend_config_id || '',
        });
      } else {
        form.reset({
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
          checkout_mode: 'standard',
          vat_number: '',
          court_name: '',
          business_owner: '',
          registration_number: '',
          active: true,
          bank_account_id: '',
          resend_config_id: '',
        });
      }
    }
  }, [open, shop, form]);

  const fetchBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('id, account_name, bank_name, active')
        .eq('active', true)
        .order('account_name');

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const fetchResendConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('resend_configs')
        .select('id, config_name, active')
        .eq('active', true)
        .order('config_name');

      if (error) throw error;
      setResendConfigs(data || []);
    } catch (error) {
      console.error('Error fetching resend configs:', error);
    }
  };

  const onSubmit = async (values: ShopFormValues) => {
    setLoading(true);
    try {
      const shopData = {
        ...values,
        company_website: values.company_website || null,
        company_phone: values.company_phone || null,
        vat_number: values.vat_number || null,
        court_name: values.court_name || null,
        business_owner: values.business_owner || null,
        registration_number: values.registration_number || null,
        bank_account_id: values.bank_account_id || null,
        resend_config_id: values.resend_config_id || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('shops')
          .update(shopData)
          .eq('id', shop.id);

        if (error) throw error;

        toast({
          title: 'Erfolg',
          description: 'Shop wurde erfolgreich aktualisiert',
        });
      } else {
        const { error } = await supabase
          .from('shops')
          .insert([shopData]);

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
        description: 'Beim Speichern des Shops ist ein Fehler aufgetreten',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Shop bearbeiten' : 'Neuen Shop erstellen'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Bearbeiten Sie die Shop-Informationen unten.' 
              : 'Erstellen Sie einen neuen Heizöl-Shop mit allen erforderlichen Informationen.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Mein Heizöl Shop" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firmenname *</FormLabel>
                    <FormControl>
                      <Input placeholder="Mustermann GmbH" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="info@beispiel.de" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input placeholder="+49 123 456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://beispiel.de" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse *</FormLabel>
                    <FormControl>
                      <Input placeholder="Musterstraße 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_postcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postleitzahl *</FormLabel>
                    <FormControl>
                      <Input placeholder="12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stadt *</FormLabel>
                    <FormControl>
                      <Input placeholder="Berlin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ländercode *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Land auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DE">Deutschland</SelectItem>
                        <SelectItem value="AT">Österreich</SelectItem>
                        <SelectItem value="CH">Schweiz</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Währung *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Währung auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="CHF">CHF</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sprache *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sprache auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="checkout_mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Checkout-Modus *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Modus auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="express">Express</SelectItem>
                        <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bank_account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bankkonto</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Bankkonto auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Kein Bankkonto</SelectItem>
                        {bankAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_name} ({account.bank_name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resend_config_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail-Konfiguration</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="E-Mail-Config auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Keine Konfiguration</SelectItem>
                        {resendConfigs.map((config) => (
                          <SelectItem key={config.id} value={config.id}>
                            {config.config_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vat_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>USt-IdNr.</FormLabel>
                    <FormControl>
                      <Input placeholder="DE123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registration_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Handelsregisternummer</FormLabel>
                    <FormControl>
                      <Input placeholder="HRB 12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="court_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registergericht</FormLabel>
                    <FormControl>
                      <Input placeholder="Amtsgericht Berlin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="business_owner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Geschäftsführer</FormLabel>
                    <FormControl>
                      <Input placeholder="Max Mustermann" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Shop aktiv</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Aktiviert oder deaktiviert den Shop für Kunden
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? 'Wird gespeichert...' : isEditing ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
