
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

interface BankAccount {
  id: string;
  account_name: string;
  account_holder: string;
  bank_name: string;
  iban: string;
  bic: string | null;
  currency: string;
  country: string;
  active: boolean;
  use_anyname: boolean;
  daily_limit: number | null;
}

interface BankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankAccount?: BankAccount;
  onSave: () => void;
}

const countries = [
  { code: 'DE', name: 'Deutschland' },
  { code: 'AT', name: 'Österreich' },
  { code: 'CH', name: 'Schweiz' },
  { code: 'NL', name: 'Niederlande' },
  { code: 'BE', name: 'Belgien' },
  { code: 'FR', name: 'Frankreich' },
];

const currencies = ['EUR', 'USD', 'CHF', 'GBP'];

export function BankAccountDialog({ open, onOpenChange, bankAccount, onSave }: BankAccountDialogProps) {
  const [formData, setFormData] = useState({
    account_name: '',
    account_holder: '',
    bank_name: '',
    iban: '',
    bic: '',
    currency: 'EUR',
    country: 'DE',
    active: true,
    use_anyname: false,
    daily_limit: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bankAccount) {
      setFormData({
        account_name: bankAccount.account_name,
        account_holder: bankAccount.account_holder,
        bank_name: bankAccount.bank_name,
        iban: bankAccount.iban,
        bic: bankAccount.bic || '',
        currency: bankAccount.currency,
        country: bankAccount.country,
        active: bankAccount.active,
        use_anyname: bankAccount.use_anyname,
        daily_limit: bankAccount.daily_limit || 0,
      });
    } else {
      setFormData({
        account_name: '',
        account_holder: '',
        bank_name: '',
        iban: '',
        bic: '',
        currency: 'EUR',
        country: 'DE',
        active: true,
        use_anyname: false,
        daily_limit: 0,
      });
    }
  }, [bankAccount, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (bankAccount) {
        const { error } = await supabase
          .from('bank_accounts')
          .update(formData)
          .eq('id', bankAccount.id);

        if (error) throw error;
        toast({
          title: 'Erfolg',
          description: 'Bankkonto wurde aktualisiert',
        });
      } else {
        const { error } = await supabase
          .from('bank_accounts')
          .insert([formData]);

        if (error) throw error;
        toast({
          title: 'Erfolg',
          description: 'Bankkonto wurde erstellt',
        });
      }

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving bank account:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Speichern des Bankkontos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {bankAccount ? 'Bankkonto bearbeiten' : 'Neues Bankkonto'}
          </DialogTitle>
          <DialogDescription>
            {bankAccount ? 'Bearbeiten Sie die Bankkonto-Details' : 'Fügen Sie ein neues Bankkonto hinzu'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="account_name">Kontoname</Label>
              <Input
                id="account_name"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="account_holder">Kontoinhaber</Label>
              <Input
                id="account_holder"
                value={formData.account_holder}
                onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bank_name">Bankname</Label>
            <Input
              id="bank_name"
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
                placeholder="DE89 3704 0044 0532 0130 00"
                disabled={Boolean(bankAccount?.id)}
                required
              />
            </div>
            <div>
              <Label htmlFor="bic">BIC (optional)</Label>
              <Input
                id="bic"
                value={formData.bic}
                onChange={(e) => setFormData({ ...formData, bic: e.target.value.toUpperCase() })}
                placeholder="COBADEFFXXX"
                disabled={Boolean(bankAccount?.id)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currency">Währung</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="country">Land</Label>
              <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="daily_limit">Tageslimit ({formData.currency})</Label>
            <Input
              id="daily_limit"
              type="number"
              min="0"
              step="0.01"
              value={formData.daily_limit}
              onChange={(e) => setFormData({ ...formData, daily_limit: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
            />
            <p className="text-sm text-gray-500 mt-1">
              Optionales Tageslimit für Informationszwecke
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
            <Label htmlFor="active">Aktiv</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="use_anyname"
              checked={formData.use_anyname}
              onCheckedChange={(checked) => setFormData({ ...formData, use_anyname: checked })}
            />
            <Label htmlFor="use_anyname">Shopname für Zahlungen verwenden</Label>
          </div>
          <p className="text-sm text-gray-500">
            Wenn aktiviert, wird der Shopname anstelle des Kontoinhabers auf Rechnungen angezeigt
          </p>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Speichern...' : 'Speichern'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
