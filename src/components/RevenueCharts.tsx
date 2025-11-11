
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, BarChart3, PieChart as PieChartIcon, ArrowUp, ArrowDown } from 'lucide-react';

interface DailyRevenueData {
  date: string;
  revenue: number;
  orders: number;
  formattedDate: string;
}

interface ShopPerformanceData {
  shopName: string;
  revenue: number;
  orders: number;
  color: string;
}

interface TrendData {
  todayRevenue: number;
  yesterdayRevenue: number;
  weekRevenue: number;
  lastWeekRevenue: number;
  todayOrders: number;
  yesterdayOrders: number;
  bestDay: { date: string; revenue: number };
  worstDay: { date: string; revenue: number };
}

type TimeFrame = 'today' | 'week' | 'month' | 'total';

export function RevenueCharts() {
  const [dailyData, setDailyData] = useState<DailyRevenueData[]>([]);
  const [shopData, setShopData] = useState<ShopPerformanceData[]>([]);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('week');

  useEffect(() => {
    fetchChartsData();
  }, [timeFrame]);

  const fetchChartsData = async () => {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const fourteenDaysAgo = new Date(today);
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      // Fetch ALL orders with pagination (no 1000 limit)
      let orders: any[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: ordersBatch, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .range(from, from + batchSize - 1);

        if (ordersError) throw ordersError;
        
        if (ordersBatch && ordersBatch.length > 0) {
          orders = [...orders, ...ordersBatch];
          from += batchSize;
          hasMore = ordersBatch.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('id, name');

      if (shopsError) throw shopsError;

      // Prepare daily revenue data (last 30 days)
      const dailyRevenueMap = new Map<string, { revenue: number; orders: number }>();
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(thirtyDaysAgo);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        dailyRevenueMap.set(dateStr, { revenue: 0, orders: 0 });
      }

      orders?.forEach(order => {
        const orderDate = order.created_at?.split('T')[0];
        if (orderDate && dailyRevenueMap.has(orderDate)) {
          const data = dailyRevenueMap.get(orderDate)!;
          const eurAmount = order.eur_amount || (order.currency === 'EUR' ? order.total_amount : 0);
          data.revenue += Number(eurAmount || 0);
          data.orders += 1;
        }
      });

      const dailyRevenueData: DailyRevenueData[] = Array.from(dailyRevenueMap.entries()).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
        formattedDate: new Date(date).toLocaleDateString('de-DE', { month: 'short', day: 'numeric' })
      }));

      // Shop performance data based on timeframe
      const getTimeFrameFilter = (timeFrame: TimeFrame) => {
        const now = new Date();
        switch (timeFrame) {
          case 'today':
            return (order: any) => order.created_at?.startsWith(now.toISOString().split('T')[0]);
          case 'week':
            return (order: any) => order.created_at && new Date(order.created_at) >= sevenDaysAgo;
          case 'month':
            return (order: any) => order.created_at && new Date(order.created_at) >= thirtyDaysAgo;
          case 'total':
          default:
            return () => true;
        }
      };

      const timeFrameFilter = getTimeFrameFilter(timeFrame);
      const filteredOrders = orders?.filter(timeFrameFilter) || [];

      const shopPerformanceData: ShopPerformanceData[] = shops?.map((shop, index) => {
        const shopOrders = filteredOrders.filter(order => order.shop_id === shop.id);
        const revenue = shopOrders.reduce((sum, order) => {
          const eurAmount = order.eur_amount || (order.currency === 'EUR' ? order.total_amount : 0);
          return sum + Number(eurAmount || 0);
        }, 0);
        
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
        
        return {
          shopName: shop.name,
          revenue,
          orders: shopOrders.length,
          color: colors[index % colors.length]
        };
      }).sort((a, b) => b.revenue - a.revenue) || [];

      // Trend data calculation
      const todayStr = today.toISOString().split('T')[0];
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const todayOrders = orders?.filter(order => order.created_at?.startsWith(todayStr)) || [];
      const yesterdayOrders = orders?.filter(order => order.created_at?.startsWith(yesterdayStr)) || [];
      const weekOrders = orders?.filter(order => order.created_at && new Date(order.created_at) >= sevenDaysAgo) || [];
      const lastWeekOrders = orders?.filter(order => {
        const orderDate = new Date(order.created_at || '');
        return orderDate >= fourteenDaysAgo && orderDate < sevenDaysAgo;
      }) || [];

      const todayRevenue = todayOrders.reduce((sum, order) => {
        const eurAmount = order.eur_amount || (order.currency === 'EUR' ? order.total_amount : 0);
        return sum + Number(eurAmount || 0);
      }, 0);
      const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => {
        const eurAmount = order.eur_amount || (order.currency === 'EUR' ? order.total_amount : 0);
        return sum + Number(eurAmount || 0);
      }, 0);
      const weekRevenue = weekOrders.reduce((sum, order) => {
        const eurAmount = order.eur_amount || (order.currency === 'EUR' ? order.total_amount : 0);
        return sum + Number(eurAmount || 0);
      }, 0);
      const lastWeekRevenue = lastWeekOrders.reduce((sum, order) => {
        const eurAmount = order.eur_amount || (order.currency === 'EUR' ? order.total_amount : 0);
        return sum + Number(eurAmount || 0);
      }, 0);

      // Find best and worst days
      const sortedDays = [...dailyRevenueData].sort((a, b) => b.revenue - a.revenue);
      const bestDay = sortedDays[0] || { date: '', revenue: 0 };
      const worstDay = sortedDays[sortedDays.length - 1] || { date: '', revenue: 0 };

      const trendInfo: TrendData = {
        todayRevenue,
        yesterdayRevenue,
        weekRevenue,
        lastWeekRevenue,
        todayOrders: todayOrders.length,
        yesterdayOrders: yesterdayOrders.length,
        bestDay: { date: bestDay.date, revenue: bestDay.revenue },
        worstDay: { date: worstDay.date, revenue: worstDay.revenue }
      };

      setDailyData(dailyRevenueData);
      setShopData(shopPerformanceData);
      setTrendData(trendInfo);
    } catch (error) {
      console.error('Error fetching charts data:', error);
      toast({
        title: "Fehler",
        description: "Chart-Daten konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: current >= 0 };
    const percentage = ((current - previous) / previous) * 100;
    return { value: Math.abs(percentage), isPositive: percentage >= 0 };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-2/3"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const dayTrend = trendData ? calculateTrend(trendData.todayRevenue, trendData.yesterdayRevenue) : { value: 0, isPositive: true };
  const weekTrend = trendData ? calculateTrend(trendData.weekRevenue, trendData.lastWeekRevenue) : { value: 0, isPositive: true };
  const orderTrend = trendData ? calculateTrend(trendData.todayOrders, trendData.yesterdayOrders) : { value: 0, isPositive: true };

  return (
    <div className="space-y-8">
      {/* Trend Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Heute vs. Gestern</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold text-gray-900">
                {trendData ? formatCurrency(trendData.todayRevenue) : '-'}
              </div>
              {dayTrend.value > 0 && (
                <div className={`flex items-center gap-1 text-sm ${dayTrend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {dayTrend.isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {dayTrend.value.toFixed(1)}%
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Diese Woche vs. Letzte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold text-gray-900">
                {trendData ? formatCurrency(trendData.weekRevenue) : '-'}
              </div>
              {weekTrend.value > 0 && (
                <div className={`flex items-center gap-1 text-sm ${weekTrend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {weekTrend.isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {weekTrend.value.toFixed(1)}%
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700">Bester Tag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-900">
              {trendData ? formatCurrency(trendData.bestDay.revenue) : '-'}
            </div>
            <div className="text-sm text-green-600">
              {trendData ? formatDate(trendData.bestDay.date) : '-'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700">Bestellungen Heute</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold text-orange-900">
                {trendData ? trendData.todayOrders : 0}
              </div>
              {orderTrend.value > 0 && (
                <div className={`flex items-center gap-1 text-sm ${orderTrend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {orderTrend.isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {orderTrend.value.toFixed(1)}%
                </div>
              )}
            </div>
            <div className="text-sm text-orange-600">
              Gestern: {trendData ? trendData.yesterdayOrders : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Revenue Chart */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Täglicher Umsatz (Letzte 30 Tage)
          </CardTitle>
          <CardDescription>
            Umsatzentwicklung mit Hover-Details für Datum, Umsatz und Bestellungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="formattedDate" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md">
                          <p className="font-medium">{new Date(data.date).toLocaleDateString('de-DE')}</p>
                          <p className="text-blue-600">Umsatz: {formatCurrency(data.revenue)}</p>
                          <p className="text-green-600">Bestellungen: {data.orders}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#1D4ED8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Shop Performance Chart */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Shop-Performance Vergleich
              </CardTitle>
              <CardDescription>
                Umsatzvergleich aller Shops nach Zeitraum
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {(['today', 'week', 'month', 'total'] as TimeFrame[]).map((frame) => (
                <Button
                  key={frame}
                  variant={timeFrame === frame ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeFrame(frame)}
                >
                  {frame === 'today' ? 'Heute' :
                   frame === 'week' ? 'Woche' :
                   frame === 'month' ? 'Monat' : 'Gesamt'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shopData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="shopName" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md">
                          <p className="font-medium">{label}</p>
                          <p className="text-blue-600">Umsatz: {formatCurrency(data.revenue)}</p>
                          <p className="text-green-600">Bestellungen: {data.orders}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {shopData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
