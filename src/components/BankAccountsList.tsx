
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Building } from 'lucide-react';
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
  created_at: string;
}

export function BankAccountsList() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch bank accounts',
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

  if (loading) {
    return <div className="text-center py-8">Loading bank accounts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bank Accounts</h2>
          <p className="text-gray-600">Manage payment bank accounts</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Bank Account
        </Button>
      </div>

      {bankAccounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bank accounts found</h3>
            <p className="text-gray-500 text-center mb-4">
              Add bank accounts to receive payments for heating oil orders
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Bank Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bankAccounts.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{account.account_name}</CardTitle>
                    <CardDescription>{account.account_holder}</CardDescription>
                  </div>
                  <Badge variant={account.active ? "default" : "secondary"}>
                    {account.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Building className="h-4 w-4 mr-2" />
                  {account.bank_name}
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-gray-900 mb-1">IBAN</h4>
                  <p className="text-sm text-gray-600 font-mono">{maskIban(account.iban)}</p>
                </div>
                
                {account.bic && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-1">BIC</h4>
                    <p className="text-sm text-gray-600 font-mono">{account.bic}</p>
                  </div>
                )}
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Currency: {account.currency}</span>
                  <span>Country: {account.country}</span>
                </div>
                
                <div className="text-xs text-gray-400">
                  Created: {new Date(account.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
