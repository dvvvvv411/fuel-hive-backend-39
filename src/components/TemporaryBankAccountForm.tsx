
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Minus } from 'lucide-react';

interface TemporaryBankAccountFormProps {
  onSubmit: (bankAccountData: {
    account_name: string;
    account_holder: string;
    bank_name: string;
    iban: string;
    bic?: string;
    currency: string;
    temp_order_number?: string;
  }) => void;
  loading?: boolean;
  defaultOrderNumber: string;
}

export function TemporaryBankAccountForm({ 
  onSubmit, 
  loading = false, 
  defaultOrderNumber 
}: TemporaryBankAccountFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    account_name: '',
    account_holder: '',
    bank_name: '',
    iban: '',
    bic: '',
    currency: 'EUR',
    temp_order_number: defaultOrderNumber
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      bic: formData.bic || undefined
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!showForm) {
    return (
      <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
        <CardContent className="flex items-center justify-center p-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <Plus className="h-4 w-4" />
            Temporäres Bankkonto erstellen
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-blue-800">
            Neues temporäres Bankkonto
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowForm(false)}
            className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="account_name" className="text-sm font-medium">
                Kontoname *
              </Label>
              <Input
                id="account_name"
                value={formData.account_name}
                onChange={(e) => handleInputChange('account_name', e.target.value)}
                placeholder="Hauptkonto"
                required
              />
            </div>
            <div>
              <Label htmlFor="account_holder" className="text-sm font-medium">
                Kontoinhaber *
              </Label>
              <Input
                id="account_holder"
                value={formData.account_holder}
                onChange={(e) => handleInputChange('account_holder', e.target.value)}
                placeholder="Max Mustermann"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bank_name" className="text-sm font-medium">
              Bankname *
            </Label>
            <Input
              id="bank_name"
              value={formData.bank_name}
              onChange={(e) => handleInputChange('bank_name', e.target.value)}
              placeholder="Sparkasse"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="iban" className="text-sm font-medium">
                IBAN *
              </Label>
              <Input
                id="iban"
                value={formData.iban}
                onChange={(e) => handleInputChange('iban', e.target.value.toUpperCase())}
                placeholder="DE89 3704 0044 0532 0130 00"
                required
              />
            </div>
            <div>
              <Label htmlFor="bic" className="text-sm font-medium">
                BIC
              </Label>
              <Input
                id="bic"
                value={formData.bic}
                onChange={(e) => handleInputChange('bic', e.target.value.toUpperCase())}
                placeholder="COBADEFFXXX"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="temp_order_number" className="text-sm font-medium">
              Bestellnummer für diese Rechnung
            </Label>
            <Input
              id="temp_order_number"
              value={formData.temp_order_number}
              onChange={(e) => handleInputChange('temp_order_number', e.target.value)}
              placeholder={defaultOrderNumber}
            />
            <p className="text-xs text-gray-500 mt-1">
              Leer lassen, um die ursprüngliche Bestellnummer zu verwenden
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Erstelle...' : 'Erstellen & Rechnung generieren'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
