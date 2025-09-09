import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Building, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, calculateDailyUsage, getDailyUsagePercentage } from '@/utils/bankingUtils';
import { TemporaryBankAccountForm } from './TemporaryBankAccountForm';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface BankAccount {
  id: string;
  account_name: string;
  account_holder: string;
  bank_name: string;
  iban: string;
  active: boolean;
  currency: string;
  daily_limit: number | null;
  is_temporary: boolean;
}

interface BankAccountWithUsage extends BankAccount {
  dailyUsage: number;
  usagePercentage: number;
}

interface DepositOptions {
  depositEnabled: boolean;
  depositNote?: string;
  depositPercentage?: number;
}

interface BankAccountSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBankAccountSelected: (bankAccountId: string, newOrderNumber?: string, options?: DepositOptions) => void;
  orderNumber: string;
}

export function BankAccountSelectionDialog({
  open,
  onOpenChange,
  onBankAccountSelected,
  orderNumber,
}: BankAccountSelectionDialogProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccountWithUsage[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [creatingTempAccount, setCreatingTempAccount] = useState(false);
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositNote, setDepositNote] = useState('Es wird eine Anzahlung in Höhe von X % des Rechnungsbetrags fällig; der Restbetrag ist nach Lieferung zu begleichen.');
  const [depositError, setDepositError] = useState<string>('');

  useEffect(() => {
    if (open) {
      fetchBankAccounts();
      setSelectedBankAccount('');
      setDepositEnabled(false);
      setDepositNote('Es wird eine Anzahlung in Höhe von X % des Rechnungsbetrags fällig; der Restbetrag ist nach Lieferung zu begleichen.');
      setDepositError('');
    }
  }, [open]);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('id, account_name, account_holder, bank_name, iban, active, currency, daily_limit, is_temporary')
        .eq('active', true)
        .eq('is_temporary', false) // Only fetch regular bank accounts
        .order('account_name');

      if (error) throw error;

      const accounts = data || [];
      const accountsWithUsage: BankAccountWithUsage[] = await Promise.all(
        accounts.map(async (account) => {
          const dailyUsage = await calculateDailyUsage(account.id);
          const usagePercentage = getDailyUsagePercentage(dailyUsage, account.daily_limit || 0);
          
          return {
            ...account,
            dailyUsage,
            usagePercentage,
          };
        })
      );

      setBankAccounts(accountsWithUsage);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      toast({
        title: 'Fehler',
        description: 'Bankkonten konnten nicht geladen werden',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemporaryAccount = async (bankAccountData: {
    account_name: string;
    account_holder: string;
    bank_name: string;
    iban: string;
    bic?: string;
    currency: string;
    new_order_number?: string;
  }) => {
    try {
      setCreatingTempAccount(true);

      // Create temporary bank account
      const { data: newBankAccount, error: bankError } = await supabase
        .from('bank_accounts')
        .insert({
          account_name: bankAccountData.account_name,
          account_holder: bankAccountData.account_holder,
          bank_name: bankAccountData.bank_name,
          iban: bankAccountData.iban,
          bic: bankAccountData.bic || null,
          currency: bankAccountData.currency,
          country: 'DE',
          is_temporary: true,
          temp_order_number: bankAccountData.new_order_number || orderNumber,
          active: true
        })
        .select()
        .single();

      if (bankError) throw bankError;

      console.log('Created temporary bank account:', newBankAccount);

      // Parse deposit options
      const depositOptions = parseDepositOptions();
      if (depositEnabled && !depositOptions) return; // Error was already set in parseDepositOptions

      // Use the temporary bank account for invoice generation
      onBankAccountSelected(newBankAccount.id, bankAccountData.new_order_number, depositOptions || undefined);
      onOpenChange(false);

      toast({
        title: 'Erfolg',
        description: 'Temporäres Bankkonto erstellt und Rechnung wird generiert',
      });

    } catch (error) {
      console.error('Error creating temporary bank account:', error);
      toast({
        title: 'Fehler',
        description: 'Temporäres Bankkonto konnte nicht erstellt werden',
        variant: 'destructive',
      });
    } finally {
      setCreatingTempAccount(false);
    }
  };

  const parseDepositOptions = (): DepositOptions | null => {
    if (!depositEnabled) {
      return { depositEnabled: false };
    }

    // Parse percentage from deposit note
    const percentageRegex = /(\d+(?:[,.]\d+)?)\s*%/;
    const match = depositNote.match(percentageRegex);
    
    if (!match) {
      setDepositError('Bitte geben Sie einen gültigen Prozentsatz im Text an (z.B. "30 %")');
      toast({
        title: 'Fehler',
        description: 'Kein gültiger Prozentsatz im Anzahlungstext gefunden',
        variant: 'destructive',
      });
      return null;
    }

    const percentageStr = match[1].replace(',', '.');
    const percentage = parseFloat(percentageStr);
    
    if (isNaN(percentage) || percentage <= 0 || percentage >= 100) {
      setDepositError('Prozentsatz muss zwischen 0 und 100 liegen');
      toast({
        title: 'Fehler',
        description: 'Prozentsatz muss zwischen 0 und 100 liegen',
        variant: 'destructive',
      });
      return null;
    }

    setDepositError('');
    return {
      depositEnabled: true,
      depositNote,
      depositPercentage: percentage
    };
  };

  const handleConfirm = () => {
    if (!selectedBankAccount) {
      toast({
        title: 'Fehler',
        description: 'Bitte wählen Sie ein Bankkonto aus',
        variant: 'destructive',
      });
      return;
    }

    // Parse deposit options
    const depositOptions = parseDepositOptions();
    if (depositEnabled && !depositOptions) return; // Error was already set in parseDepositOptions

    onBankAccountSelected(selectedBankAccount, undefined, depositOptions || undefined);
    onOpenChange(false);
    setSelectedBankAccount('');
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getUsageIcon = (percentage: number) => {
    if (percentage >= 90) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    return <TrendingUp className="h-4 w-4 text-gray-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Bankkonto auswählen
          </DialogTitle>
          <DialogDescription>
            Wählen Sie das Bankkonto für die Rechnung #{orderNumber} oder erstellen Sie ein temporäres Konto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Temporary Bank Account Creation Form */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Temporäres Bankkonto erstellen</h3>
            <TemporaryBankAccountForm
              onSubmit={handleCreateTemporaryAccount}
              loading={creatingTempAccount}
              defaultOrderNumber={orderNumber}
            />
          </div>

          {/* Existing Regular Bank Accounts */}
          {loading ? (
            <div className="text-center py-4">
              Lade Bankkonten...
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Vorhandene Bankkonten</h3>
              
              {bankAccounts.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Keine aktiven Bankkonten gefunden
                </div>
              ) : (
                <RadioGroup value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
                  <div className="space-y-3">
                    {bankAccounts.map((account) => (
                      <div key={account.id} className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value={account.id} id={account.id} />
                        <Label htmlFor={account.id} className="flex-1 cursor-pointer">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium">{account.account_name}</div>
                                <div className="text-sm text-gray-500">{account.account_holder}</div>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <Building className="h-3 w-3 mr-1" />
                                  {account.bank_name}
                                </div>
                              </div>
                              <div className="text-right">
                                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {account.iban}
                                </code>
                              </div>
                            </div>

                            {/* Daily usage information */}
                            {account.daily_limit && account.daily_limit > 0 ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-1">
                                    {getUsageIcon(account.usagePercentage)}
                                    <span className="text-gray-600">Tagesnutzung:</span>
                                  </div>
                                  <span className="font-medium">
                                    {formatCurrency(account.dailyUsage, account.currency)} / {formatCurrency(account.daily_limit, account.currency)}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <Progress 
                                    value={account.usagePercentage} 
                                    className="h-2"
                                  />
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>{account.usagePercentage.toFixed(1)}% genutzt</span>
                                    {account.usagePercentage >= 90 && (
                                      <span className="text-red-500 font-medium">Limit fast erreicht!</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center text-sm text-gray-500">
                                <TrendingUp className="h-4 w-4 mr-1" />
                                <span>Heute: {formatCurrency(account.dailyUsage, account.currency)} (kein Limit)</span>
                              </div>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}
            </div>
          )}

          {/* Deposit Option */}
          <div className="border-t pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="deposit-enabled"
                checked={depositEnabled}
                onCheckedChange={(checked) => setDepositEnabled(checked as boolean)}
              />
              <Label htmlFor="deposit-enabled" className="text-sm font-medium">
                Anzahlung aktivieren
              </Label>
            </div>

            {depositEnabled && (
              <div className="space-y-2">
                <Label htmlFor="deposit-note" className="text-sm font-medium">
                  Anzahlungstext für Rechnung:
                </Label>
                <Textarea
                  id="deposit-note"
                  value={depositNote}
                  onChange={(e) => {
                    setDepositNote(e.target.value);
                    setDepositError('');
                  }}
                  className={`min-h-20 ${depositError ? 'border-red-500' : ''}`}
                  placeholder="Es wird eine Anzahlung in Höhe von X % des Rechnungsbetrags fällig; der Restbetrag ist nach Lieferung zu begleichen."
                />
                {depositError && (
                  <p className="text-sm text-red-600">{depositError}</p>
                )}
                <p className="text-xs text-gray-500">
                  Hinweis: Der Prozentsatz wird automatisch aus dem Text erkannt (z.B. "30 %" oder "25,5 %")
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedBankAccount || loading || creatingTempAccount}
          >
            {creatingTempAccount ? 'Erstelle...' : 'Rechnung erstellen'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
