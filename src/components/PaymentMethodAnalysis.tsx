
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { CreditCard, TrendingUp, BarChart3, Target } from 'lucide-react';

interface PaymentMethodStats {
  method: string;
  todayOrders: number;
  totalOrders: number;
  todayRevenue: number;
  totalRevenue: number;
  avgOrderValue: number;
  marketShare: number;
  conversionRate: number;
}

interface ShopPaymentStats {
  shopName: string;
  preferredMethod: string;
  methodDistribution: { [method: string]: number };
}

export function PaymentMethodAnalysis() {
  const [paymentStats, setPaymentStats] = useState<PaymentMethodStats[]>([]);
  const [shopStats, setShopStats] = useState<ShopPaymentStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentMethodStats();
  }, []);

  const fetchPaymentMethodStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch all orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*');

      if (ordersError) throw ordersError;

      // Fetch shops
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('id, name');

      if (shopsError) throw shopsError;

      // Aggregate payment method statistics
      const methodMap = new Map<string, {
        todayOrders: number;
        totalOrders: number;
        todayRevenue: number;
        totalRevenue: number;
      }>();

      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0;
      const totalOrders = orders?.length || 0;

      orders?.forEach(order => {
        const method = order.payment_method || 'Unbekannt';
        const isToday = order.created_at?.startsWith(today);
        const revenue = Number(order.total_amount || 0);

        if (!methodMap.has(method)) {
          methodMap.set(method, {
            todayOrders: 0,
            totalOrders: 0,
            todayRevenue: 0,
            totalRevenue: 0
          });
        }

        const stats = methodMap.get(method)!;
        stats.totalOrders++;
        stats.totalRevenue += revenue;

        if (isToday) {
          stats.todayOrders++;
          stats.todayRevenue += revenue;
        }
      });

      // Convert to array with calculated metrics
      const paymentMethodStats: PaymentMethodStats[] = Array.from(methodMap.entries()).map(([method, stats]) => ({
        method,
        todayOrders: stats.todayOrders,
        totalOrders: stats.totalOrders,
        todayRevenue: stats.todayRevenue,
        totalRevenue: stats.totalRevenue,
        avgOrderValue: stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0,
        marketShare: totalRevenue > 0 ? (stats.totalRevenue / totalRevenue) * 100 : 0,
        conversionRate: totalOrders > 0 ? (stats.totalOrders / totalOrders) * 100 : 0
      }));

      // Shop-specific payment method analysis
      const shopPaymentStats: ShopPaymentStats[] = shops?.map(shop => {
        const shopOrders = orders?.filter(order => order.shop_id === shop.id) || [];
        const methodCounts = new Map<string, number>();

        shopOrders.forEach(order => {
          const method = order.payment_method || 'Unbekannt';
          methodCounts.set(method, (methodCounts.get(method) || 0) + 1);
        });

        let preferredMethod = 'Keine Daten';
        let maxCount = 0;
        const methodDistribution: { [method: string]: number } = {};

        methodCounts.forEach((count, method) => {
          if (count > maxCount) {
            maxCount = count;
            preferredMethod = method;
          }
          methodDistribution[method] = shopOrders.length > 0 ? (count / shopOrders.length) * 100 : 0;
        });

        return {
          shopName: shop.name,
          preferredMethod,
          methodDistribution
        };
      }) || [];

      setPaymentStats(paymentMethodStats.sort((a, b) => b.totalRevenue - a.totalRevenue));
      setShopStats(shopStats);
    } catch (error) {
      console.error('Error fetching payment method stats:', error);
      toast({
        title: "Fehler",
        description: "Zahlungsmethoden-Statistiken konnten nicht geladen werden",
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

  const getMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'vorkasse':
      case 'prepayment':
        return 'bg-green-100 text-green-800';
      case 'rechnung':
      case 'invoice':
        return 'bg-blue-100 text-blue-800';
      case 'sepa':
        return 'bg-purple-100 text-purple-800';
      case 'kreditkarte':
      case 'credit_card':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-2/3"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-12 bg-gray-100 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const topMethod = paymentStats[0];
  const vorkasseStats = paymentStats.find(stat => stat.method.toLowerCase().includes('vorkasse') || stat.method.toLowerCase().includes('prepayment'));
  const rechnungStats = paymentStats.find(stat => stat.method.toLowerCase().includes('rechnung') || stat.method.toLowerCase().includes('invoice'));

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700">Vorkasse Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {vorkasseStats ? vorkasseStats.marketShare.toFixed(1) : '0'}%
            </div>
            <div className="text-sm text-green-600">
              {vorkasseStats ? formatCurrency(vorkasseStats.totalRevenue) : 'Keine Daten'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">Rechnung Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {rechnungStats ? rechnungStats.marketShare.toFixed(1) : '0'}%
            </div>
            <div className="text-sm text-blue-600">
              {rechnungStats ? formatCurrency(rechnungStats.totalRevenue) : 'Keine Daten'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700">Höchster Ø Bestellwert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {topMethod ? formatCurrency(topMethod.avgOrderValue) : '-'}
            </div>
            <div className="text-sm text-purple-600">
              {topMethod ? topMethod.method : 'Keine Daten'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Statistics Table */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Zahlungsmethoden-Analyse
          </CardTitle>
          <CardDescription>
            Performance und Verteilung aller Zahlungsarten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zahlungsart</TableHead>
                  <TableHead className="text-right">Heute</TableHead>
                  <TableHead className="text-right">Total Bestellungen</TableHead>
                  <TableHead className="text-right">Total Umsatz</TableHead>
                  <TableHead className="text-right">Ø Bestellwert</TableHead>
                  <TableHead className="text-right">Marktanteil</TableHead>
                  <TableHead className="text-center">Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentStats.map((stat) => (
                  <TableRow key={stat.method} className="hover:bg-gray-50">
                    <TableCell>
                      <Badge className={getMethodColor(stat.method)}>
                        {stat.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-medium">{stat.todayOrders}</span>
                        <span className="text-xs text-gray-500">{formatCurrency(stat.todayRevenue)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">{formatNumber(stat.totalOrders)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">{formatCurrency(stat.totalRevenue)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">{formatCurrency(stat.avgOrderValue)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-medium">{stat.marketShare.toFixed(1)}%</span>
                        <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                          <div 
                            className="bg-purple-600 h-1 rounded-full" 
                            style={{ width: `${Math.min(stat.marketShare * 2, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {stat.marketShare >= 20 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : stat.marketShare >= 10 ? (
                          <Target className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <BarChart3 className="h-4 w-4 text-gray-600" />
                        )}
                        <span className="text-xs font-medium">
                          {stat.conversionRate.toFixed(1)}%
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
    </div>
  );
}
