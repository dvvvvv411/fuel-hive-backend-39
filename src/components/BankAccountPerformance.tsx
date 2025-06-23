
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { CreditCard, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface BankAccountStats {
  accountId: string;
  accountName: string;
  bankName: string;
  assignedShops: number;
  shopNames: string[];
  todayRevenue: number;
  totalRevenue: number;
  todayTransactions: number;
  totalTransactions: number;
  marketShare: number;
  isActive: boolean;
}

export function BankAccountPerformance() {
  const [bankStats, setBankStats] = useState<BankAccountStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<string>('totalRevenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchBankAccountStats();
  }, []);

  const fetchBankAccountStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch all bank accounts
      const { data: bankAccounts, error: bankError } = await supabase
        .from('bank_accounts')
        .select('*');

      if (bankError) throw bankError;

      // Fetch shops with bank account assignments
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('id, name, bank_account_id');

      if (shopsError) throw shopsError;

      // Fetch only orders that have a selected bank account assigned
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .not('selected_bank_account_id', 'is', null);

      if (ordersError) throw ordersError;

      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0;

      const bankAccountStats: BankAccountStats[] = bankAccounts?.map(account => {
        // Find shops using this bank account as their default
        const assignedShops = shops?.filter(shop => shop.bank_account_id === account.id) || [];
        const shopIds = assignedShops.map(shop => shop.id);
        
        // Find orders that have this bank account selected (either from shop assignment or manual selection)
        const accountOrders = orders?.filter(order => 
          order.selected_bank_account_id === account.id
        ) || [];
        
        // Today's data
        const todayOrders = accountOrders.filter(order => 
          order.created_at?.startsWith(today)
        );
        const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
        
        // Total data
        const accountTotalRevenue = accountOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
        
        // Market share
        const marketShare = totalRevenue > 0 ? (accountTotalRevenue / totalRevenue) * 100 : 0;

        return {
          accountId: account.id,
          accountName: account.account_name,
          bankName: account.bank_name,
          assignedShops: assignedShops.length,
          shopNames: assignedShops.map(shop => shop.name),
          todayRevenue,
          totalRevenue: accountTotalRevenue,
          todayTransactions: todayOrders.length,
          totalTransactions: accountOrders.length,
          marketShare,
          isActive: account.active
        };
      }) || [];

      setBankStats(bankAccountStats);
    } catch (error) {
      console.error('Error fetching bank account stats:', error);
      toast({
        title: "Fehler",
        description: "Bankkonto-Statistiken konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('de-DE').format(num);
  };

  const sortData = (data: BankAccountStats[], field: string, direction: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      const aValue = a[field as keyof BankAccountStats];
      const bValue = b[field as keyof BankAccountStats];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      return direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  };

  const handleSort = (field: string) => {
    const newDirection = sortField === field && sortDirection === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortDirection(newDirection);
  };

  const getPerformanceColor = (marketShare: number) => {
    if (marketShare >= 25) return 'bg-green-100 text-green-800';
    if (marketShare >= 10) return 'bg-yellow-100 text-yellow-800';
    if (marketShare > 0) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-2/3"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedData = sortData(bankStats, sortField, sortDirection);
  const topPerformer = sortedData.find(account => account.totalRevenue > 0);
  const underperformers = sortedData.filter(account => account.totalRevenue === 0 || !account.isActive);

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          Bankkonto-Performance
        </CardTitle>
        <CardDescription>
          Umsatzverteilung und Performance-Analyse aller Bankkonten (nur Bestellungen mit zugewiesenen Bankkonten)
        </CardDescription>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Top Performer</span>
            </div>
            <div className="text-lg font-bold text-green-900">
              {topPerformer ? topPerformer.accountName : 'Keine Daten'}
            </div>
            <div className="text-sm text-green-600">
              {topPerformer ? formatCurrency(topPerformer.totalRevenue) : '-'}
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Aktive Konten</span>
            </div>
            <div className="text-lg font-bold text-blue-900">
              {bankStats.filter(account => account.isActive).length}
            </div>
            <div className="text-sm text-blue-600">
              von {bankStats.length} Gesamt
            </div>
          </div>
          
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Unterperformend</span>
            </div>
            <div className="text-lg font-bold text-orange-900">
              {underperformers.length}
            </div>
            <div className="text-sm text-orange-600">
              Konten ohne Umsatz
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('accountName')}
                >
                  Kontoname {sortField === 'accountName' && (sortDirection === 'desc' ? '↓' : '↑')}
                </TableHead>
                <TableHead>Bank & Status</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 select-none text-center"
                  onClick={() => handleSort('assignedShops')}
                >
                  Zugewiesene Shops {sortField === 'assignedShops' && (sortDirection === 'desc' ? '↓' : '↑')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 select-none text-right"
                  onClick={() => handleSort('todayRevenue')}
                >
                  Heute Umsatz {sortField === 'todayRevenue' && (sortDirection === 'desc' ? '↓' : '↑')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 select-none text-right"
                  onClick={() => handleSort('totalRevenue')}
                >
                  Total Umsatz {sortField === 'totalRevenue' && (sortDirection === 'desc' ? '↓' : '↑')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 select-none text-right"
                  onClick={() => handleSort('marketShare')}
                >
                  Marktanteil {sortField === 'marketShare' && (sortDirection === 'desc' ? '↓' : '↑')}
                </TableHead>
                <TableHead className="text-center">Transaktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((account) => (
                <TableRow key={account.accountId} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="font-medium text-gray-900">{account.accountName}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-gray-700">{account.bankName}</span>
                      <Badge variant={account.isActive ? 'default' : 'destructive'} className="text-xs w-fit">
                        {account.isActive ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col">
                      <Badge variant="outline" className="mb-1">
                        {account.assignedShops}
                      </Badge>
                      {account.shopNames.length > 0 && (
                        <div className="text-xs text-gray-500 max-w-32 truncate" title={account.shopNames.join(', ')}>
                          {account.shopNames.join(', ')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col">
                      <span className="font-medium">{formatCurrency(account.todayRevenue)}</span>
                      <span className="text-xs text-gray-500">{account.todayTransactions} Trans.</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col">
                      <span className="font-medium">{formatCurrency(account.totalRevenue)}</span>
                      <span className="text-xs text-gray-500">{account.totalTransactions} Trans.</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <Badge className={getPerformanceColor(account.marketShare)}>
                        {account.marketShare.toFixed(1)}%
                      </Badge>
                      {account.marketShare > 0 && (
                        <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                          <div 
                            className="bg-blue-600 h-1 rounded-full" 
                            style={{ width: `${Math.min(account.marketShare * 4, 100)}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col text-sm">
                      <span className="font-medium">{formatNumber(account.totalTransactions)}</span>
                      <span className="text-gray-500 text-xs">
                        Heute: {account.todayTransactions}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
