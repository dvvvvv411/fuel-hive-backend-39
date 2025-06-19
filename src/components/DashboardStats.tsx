
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Euro, FileText, BarChart3, Clock, CheckCircle, Send, CreditCard, Droplets, Truck, Gift } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DashboardData {
  todayRevenue: number;
  totalRevenue: number;
  todayOrders: number;
  totalOrders: number;
  todayAvgOrder: number;
  totalAvgOrder: number;
  tokensCreated: number;
  ordersCompleted: number;
  statusStats: {
    pending: { today: number; total: number };
    confirmed: { today: number; total: number };
    invoiceSent: { today: number; total: number };
    paid: { today: number; total: number };
  };
  productStats: {
    standard: number;
    premium: number;
    avgLiters: number;
    freeDeliveries: number;
    paidDeliveries: number;
  };
}

export function DashboardStats() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch all orders
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*');

      if (error) throw error;

      // Fetch order tokens
      const { data: tokens, error: tokensError } = await supabase
        .from('order_tokens')
        .select('*');

      if (tokensError) throw tokensError;

      const todayOrders = orders?.filter(order => 
        order.created_at?.startsWith(today)
      ) || [];

      const allOrders = orders || [];

      // Calculate revenue
      const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
      const totalRevenue = allOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

      // Calculate average order values
      const todayAvgOrder = todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0;
      const totalAvgOrder = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;

      // Status statistics
      const getStatusCount = (status: string, isToday: boolean) => {
        const orderSet = isToday ? todayOrders : allOrders;
        return orderSet.filter(order => order.status === status).length;
      };

      // Product statistics
      const standardOrders = allOrders.filter(order => 
        order.product?.toLowerCase().includes('standard') || 
        order.product?.toLowerCase().includes('heizöl') ||
        (!order.product?.toLowerCase().includes('premium') && order.product)
      ).length;
      
      const premiumOrders = allOrders.filter(order => 
        order.product?.toLowerCase().includes('premium')
      ).length;

      const totalLiters = allOrders.reduce((sum, order) => sum + Number(order.liters || 0), 0);
      const avgLiters = allOrders.length > 0 ? totalLiters / allOrders.length : 0;

      const freeDeliveries = allOrders.filter(order => Number(order.delivery_fee || 0) === 0).length;
      const paidDeliveries = allOrders.filter(order => Number(order.delivery_fee || 0) > 0).length;

      setData({
        todayRevenue,
        totalRevenue,
        todayOrders: todayOrders.length,
        totalOrders: allOrders.length,
        todayAvgOrder,
        totalAvgOrder,
        tokensCreated: tokens?.length || 0,
        ordersCompleted: allOrders.filter(order => order.status === 'confirmed' || order.status === 'paid').length,
        statusStats: {
          pending: {
            today: getStatusCount('pending', true),
            total: getStatusCount('pending', false)
          },
          confirmed: {
            today: getStatusCount('confirmed', true),
            total: getStatusCount('confirmed', false)
          },
          invoiceSent: {
            today: allOrders.filter(order => 
              order.invoice_sent && order.created_at?.startsWith(today)
            ).length,
            total: allOrders.filter(order => order.invoice_sent).length
          },
          paid: {
            today: getStatusCount('paid', true),
            total: getStatusCount('paid', false)
          }
        },
        productStats: {
          standard: standardOrders,
          premium: premiumOrders,
          avgLiters,
          freeDeliveries,
          paidDeliveries
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Fehler",
        description: "Dashboard-Daten konnten nicht geladen werden",
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

  const calculateTrend = (today: number, total: number) => {
    if (total === 0) return { value: 0, isPositive: true };
    const percentage = ((today / total) * 100);
    return { value: percentage, isPositive: percentage >= 0 };
  };

  const getConversionRate = () => {
    if (!data || data.tokensCreated === 0) return 0;
    return (data.ordersCompleted / data.tokensCreated) * 100;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const revenueTrend = calculateTrend(data.todayRevenue, data.totalRevenue);
  const ordersTrend = calculateTrend(data.todayOrders, data.totalOrders);
  const avgOrderTrend = calculateTrend(data.todayAvgOrder, data.totalAvgOrder);
  const conversionRate = getConversionRate();

  return (
    <div className="space-y-8">
      {/* Haupt-Statistik-Karten */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Haupt-Statistiken</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Gesamtumsatz */}
          <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Gesamtumsatz</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Euro className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalRevenue)}</div>
              <div className="flex items-center gap-2 mt-2">
                <div className="text-sm text-gray-600">Heute: {formatCurrency(data.todayRevenue)}</div>
                {revenueTrend.value > 0 && (
                  <div className={`flex items-center gap-1 text-xs ${revenueTrend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {revenueTrend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {revenueTrend.value.toFixed(1)}%
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Anzahl Bestellungen */}
          <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Bestellungen</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-bold text-gray-900">{formatNumber(data.totalOrders)}</div>
              <div className="flex items-center gap-2 mt-2">
                <div className="text-sm text-gray-600">Heute: {formatNumber(data.todayOrders)}</div>
                {ordersTrend.value > 0 && (
                  <div className={`flex items-center gap-1 text-xs ${ordersTrend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {ordersTrend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {ordersTrend.value.toFixed(1)}%
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Durchschnittlicher Bestellwert */}
          <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Ø Bestellwert</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalAvgOrder)}</div>
              <div className="flex items-center gap-2 mt-2">
                <div className="text-sm text-gray-600">Heute: {formatCurrency(data.todayAvgOrder)}</div>
                {avgOrderTrend.value > 0 && (
                  <div className={`flex items-center gap-1 text-xs ${avgOrderTrend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {avgOrderTrend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {avgOrderTrend.value.toFixed(1)}%
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-bold text-gray-900">{conversionRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600 mt-2">
                {data.ordersCompleted} von {data.tokensCreated} Token
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status-Übersicht */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status-Übersicht</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pending */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
              <Clock className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  {data.statusStats.pending.total}
                </Badge>
                <span className="text-sm text-gray-600">Gesamt</span>
              </div>
              <div className="text-sm text-gray-600">Heute: {data.statusStats.pending.today}</div>
            </CardContent>
          </Card>

          {/* Confirmed */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Bestätigt</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {data.statusStats.confirmed.total}
                </Badge>
                <span className="text-sm text-gray-600">Gesamt</span>
              </div>
              <div className="text-sm text-gray-600">Heute: {data.statusStats.confirmed.today}</div>
            </CardContent>
          </Card>

          {/* Invoice Sent */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Rechnung versendet</CardTitle>
              <Send className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {data.statusStats.invoiceSent.total}
                </Badge>
                <span className="text-sm text-gray-600">Gesamt</span>
              </div>
              <div className="text-sm text-gray-600">Heute: {data.statusStats.invoiceSent.today}</div>
            </CardContent>
          </Card>

          {/* Paid */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Bezahlt</CardTitle>
              <CreditCard className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  {data.statusStats.paid.total}
                </Badge>
                <span className="text-sm text-gray-600">Gesamt</span>
              </div>
              <div className="text-sm text-gray-600">Heute: {data.statusStats.paid.today}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Produktstatistiken */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Produktstatistiken</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Standard vs Premium */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Heizöl-Verkäufe</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Standard:</span>
                  <Badge variant="outline" className="bg-gray-50">
                    {data.productStats.standard}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Premium:</span>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    {data.productStats.premium}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Durchschnittliche Liter */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Ø Liter/Bestellung</CardTitle>
              <Droplets className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-bold text-gray-900">
                {data.productStats.avgLiters.toFixed(0)}L
              </div>
              <div className="text-sm text-gray-600 mt-1">pro Bestellung</div>
            </CardContent>
          </Card>

          {/* Liefergebühren */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Liefergebühren</CardTitle>
              <Truck className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Kostenpflichtig:</span>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    {data.productStats.paidDeliveries}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kostenlose Lieferungen */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Kostenlose Lieferungen</CardTitle>
              <Gift className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-bold text-green-600">
                {data.productStats.freeDeliveries}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {((data.productStats.freeDeliveries / data.totalOrders) * 100).toFixed(1)}% aller Bestellungen
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
