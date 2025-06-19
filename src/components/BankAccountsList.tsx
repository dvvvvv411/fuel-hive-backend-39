import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Plus, Building, Edit, Trash2, Store, Euro, TrendingUp, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { BankAccountDialog } from './BankAccountDialog';
import { BankAccountDetailsDialog } from './BankAccountDetailsDialog';
import { formatCurrency, calculateDailyUsage, getDailyUsagePercentage } from '@/utils/bankingUtils';

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
  created_at: string;
}

interface Shop {
  id: string;
  name: string;
  bank_account_id: string | null;
}

interface BankAccountWithUsage extends BankAccount {
  dailyUsage: number;
  usagePercentage: number;
}

export function BankAccountsList() {
  const [bankAccounts, setBankAccounts] = useState<BankAccountWithUsage[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | undefined>();
  const [selectedAccountForDetails, setSelectedAccountForDetails] = useState<BankAccount | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bankAccountsResponse, shopsResponse] = await Promise.all([
        supabase
          .from('bank_accounts')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('shops')
          .select('id, name, bank_account_id')
      ]);

      if (bankAccountsResponse.error) throw bankAccountsResponse.error;
      if (shopsResponse.error) throw shopsResponse.error;

      const accounts = bankAccountsResponse.data || [];
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
      setShops(shopsResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Laden der Daten',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const maskIban = (iban: string) => {
    if (iban.length <= 8) return iban;
    return iban.substring(0, 4) + '*'.repeat(iban.length - 8) + iban.substring(iban.length - 4);
  };

  const getShopsUsingAccount = (accountId: string) => {
    return shops.filter(shop => shop.bank_account_id === accountId);
  };

  const toggleAccountStatus = async (account: BankAccount) => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ active: !account.active })
        .eq('id', account.id);

      if (error) throw error;

      toast({
        title: 'Erfolg',
        description: `Bankkonto wurde ${!account.active ? 'aktiviert' : 'deaktiviert'}`,
      });

      fetchData();
    } catch (error) {
      console.error('Error updating account status:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Aktualisieren des Kontostatus',
        variant: 'destructive',
      });
    }
  };

  const deleteAccount = async (account: BankAccount) => {
    const shopsUsing = getShopsUsingAccount(account.id);
    if (shopsUsing.length > 0) {
      toast({
        title: 'Fehler',
        description: `Bankkonto wird noch von ${shopsUsing.length} Shop(s) verwendet`,
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('Sind Sie sicher, dass Sie dieses Bankkonto löschen möchten?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', account.id);

      if (error) throw error;

      toast({
        title: 'Erfolg',
        description: 'Bankkonto wurde gelöscht',
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Löschen des Bankkontos',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (account: BankAccount) => {
    setSelectedAccount(account);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedAccount(undefined);
    setDialogOpen(true);
  };

  const handleViewDetails = (account: BankAccount) => {
    setSelectedAccountForDetails(account);
    setDetailsDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8">Bankkonten werden geladen...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bankkonten-Verwaltung</h2>
          <p className="text-gray-600">Verwalten Sie Zahlungs-Bankkonten</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Bankkonto hinzufügen
        </Button>
      </div>

      {bankAccounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Bankkonten gefunden</h3>
            <p className="text-gray-500 text-center mb-4">
              Fügen Sie Bankkonten hinzu, um Zahlungen für Heizöl-Bestellungen zu erhalten
            </p>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Bankkonto hinzufügen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Bankkonten ({bankAccounts.length})</CardTitle>
            <CardDescription>
              Übersicht aller konfigurierten Bankkonten mit Tageslimits und aktueller Nutzung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kontoname</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>IBAN</TableHead>
                  <TableHead>Währung</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Anyname</TableHead>
                  <TableHead>Tageslimit</TableHead>
                  <TableHead>Verwendung</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bankAccounts.map((account) => {
                  const shopsUsing = getShopsUsingAccount(account.id);
                  return (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{account.account_name}</div>
                          <div className="text-sm text-gray-500">{account.account_holder}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2 text-gray-500" />
                          {account.bank_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {maskIban(account.iban)}
                        </code>
                      </TableCell>
                      <TableCell>{account.currency}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={account.active ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => toggleAccountStatus(account)}
                        >
                          {account.active ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {account.use_anyname ? (
                          <div className="flex items-center text-green-600">
                            <Store className="h-4 w-4 mr-1" />
                            <span className="text-sm">Shopname</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Kontoinhaber</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {account.daily_limit && account.daily_limit > 0 ? (
                          <div className="flex items-center">
                            <Euro className="h-4 w-4 mr-1 text-gray-500" />
                            <span className="text-sm font-medium">
                              {formatCurrency(account.daily_limit, account.currency)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Kein Limit</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {account.daily_limit && account.daily_limit > 0 ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>{formatCurrency(account.dailyUsage, account.currency)}</span>
                              <span className="text-gray-500">{account.usagePercentage.toFixed(1)}%</span>
                            </div>
                            <Progress 
                              value={account.usagePercentage} 
                              className="h-2"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-500">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            <span className="text-sm">{formatCurrency(account.dailyUsage, account.currency)}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {shopsUsing.length > 0 ? (
                          <div className="text-sm">
                            <div className="font-medium">{shopsUsing.length} Shop(s)</div>
                            <div className="text-gray-500">
                              {shopsUsing.map(shop => shop.name).join(', ')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Nicht verwendet</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(account)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(account)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteAccount(account)}
                            disabled={shopsUsing.length > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <BankAccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bankAccount={selectedAccount}
        onSave={fetchData}
      />

      <BankAccountDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        bankAccount={selectedAccountForDetails}
      />
    </div>
  );
}
