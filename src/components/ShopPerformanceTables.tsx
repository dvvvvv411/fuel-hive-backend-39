
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, Edit, Store, Globe, Zap, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface ShopPerformanceData {
  shopId: string;
  shopName: string;
  companyName: string;
  country: string;
  language: string;
  checkoutMode: string;
  active: boolean;
  todayOrders: number;
  todayRevenue: number;
  todayAvgOrder: number;
  totalOrders: number;
  totalRevenue: number;
  totalAvgOrder: number;
  revenuePercentage: number;
  conversionRate: number;
  last7DaysTrend: number;
  bestDay: string | null;
  bestDayRevenue: number;
}

export function ShopPerformanceTables() {
  const [performanceData, setPerformanceData] = useState<ShopPerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [todaySortField, setTodaySortField] = useState<string>('todayRevenue');
  const [todaySortDirection, setTodaySortDirection] = useState<'asc' | 'desc'>('desc');
  const [totalSortField, setTotalSortField] = useState<string>('totalRevenue');
  const [totalSortDirection, setTotalSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isTotalCollapsed, setIsTotalCollapsed] = useState(false);

  useEffect(() => {
    fetchShopPerformanceData();
  }, []);

  const fetchShopPerformanceData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Fetch shops
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('*');

      if (shopsError) throw shopsError;

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

      // Fetch ALL order tokens with pagination
      let tokens: any[] = [];
      from = 0;
      hasMore = true;

      while (hasMore) {
        const { data: tokensBatch, error: tokensError } = await supabase
          .from('order_tokens')
          .select('*')
          .range(from, from + batchSize - 1);

        if (tokensError) throw tokensError;
        
        if (tokensBatch && tokensBatch.length > 0) {
          tokens = [...tokens, ...tokensBatch];
          from += batchSize;
          hasMore = tokensBatch.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0;

      const performanceData: ShopPerformanceData[] = shops?.map(shop => {
        const shopOrders = orders?.filter(order => order.shop_id === shop.id) || [];
        const shopTokens = tokens?.filter(token => token.shop_id === shop.id) || [];
        
        // Today's data
        const todayOrders = shopOrders.filter(order => 
          order.created_at?.startsWith(today)
        );
        const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
        const todayAvgOrder = todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0;

        // Total data
        const totalOrders = shopOrders.length;
        const shopTotalRevenue = shopOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
        const totalAvgOrder = totalOrders > 0 ? shopTotalRevenue / totalOrders : 0;

        // Revenue percentage
        const revenuePercentage = totalRevenue > 0 ? (shopTotalRevenue / totalRevenue) * 100 : 0;

        // Conversion rate (completed orders / tokens created)
        const completedOrders = shopOrders.filter(order => 
          order.status === 'confirmed' || order.status === 'paid'
        ).length;
        const conversionRate = shopTokens.length > 0 ? (completedOrders / shopTokens.length) * 100 : 0;

        // Last 7 days trend
        const last7DaysOrders = shopOrders.filter(order => 
          order.created_at && order.created_at >= sevenDaysAgo
        );
        const last7DaysRevenue = last7DaysOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
        const previousWeekRevenue = shopTotalRevenue - last7DaysRevenue;
        const last7DaysTrend = previousWeekRevenue > 0 ? ((last7DaysRevenue - previousWeekRevenue) / previousWeekRevenue) * 100 : 0;

        // Best day
        const dailyRevenue = shopOrders.reduce((acc, order) => {
          const date = order.created_at?.split('T')[0];
          if (date) {
            acc[date] = (acc[date] || 0) + Number(order.total_amount || 0);
          }
          return acc;
        }, {} as Record<string, number>);

        const bestDay = Object.entries(dailyRevenue).reduce<{ date: string | null; revenue: number }>((best, [date, revenue]: [string, number]) => {
          return revenue > best.revenue ? { date, revenue } : best;
        }, { date: null, revenue: 0 });

        return {
          shopId: shop.id,
          shopName: shop.name,
          companyName: shop.company_name,
          country: shop.country_code,
          language: shop.language,
          checkoutMode: shop.checkout_mode,
          active: shop.active,
          todayOrders: todayOrders.length,
          todayRevenue,
          todayAvgOrder,
          totalOrders,
          totalRevenue: shopTotalRevenue,
          totalAvgOrder,
          revenuePercentage,
          conversionRate,
          last7DaysTrend,
          bestDay: bestDay.date,
          bestDayRevenue: bestDay.revenue
        };
      }) || [];

      setPerformanceData(performanceData);
    } catch (error) {
      console.error('Error fetching shop performance data:', error);
      toast({
        title: "Fehler",
        description: "Shop-Performance-Daten konnten nicht geladen werden",
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('de-DE');
  };

  const sortData = (data: ShopPerformanceData[], field: string, direction: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      const aValue = a[field as keyof ShopPerformanceData];
      const bValue = b[field as keyof ShopPerformanceData];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      return direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  };

  const handleSort = (field: string, table: 'today' | 'total') => {
    if (table === 'today') {
      const newDirection = todaySortField === field && todaySortDirection === 'desc' ? 'asc' : 'desc';
      setTodaySortField(field);
      setTodaySortDirection(newDirection);
    } else {
      const newDirection = totalSortField === field && totalSortDirection === 'desc' ? 'asc' : 'desc';
      setTotalSortField(field);
      setTotalSortDirection(newDirection);
    }
  };

  const getPerformanceColor = (value: number, type: 'revenue' | 'orders') => {
    if (type === 'revenue') {
      if (value >= 1000) return 'bg-green-100 text-green-800';
      if (value >= 500) return 'bg-yellow-100 text-yellow-800';
      return 'bg-gray-100 text-gray-800';
    } else {
      if (value >= 10) return 'bg-green-100 text-green-800';
      if (value >= 5) return 'bg-yellow-100 text-yellow-800';
      return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-100 rounded-xl w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const todayData = sortData(performanceData, todaySortField, todaySortDirection);
  const totalData = sortData(performanceData, totalSortField, totalSortDirection);

  return (
    <div className="space-y-8">
      {/* Heute Performance */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-gray-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50/80 to-white">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            Shop-Performance (Heute)
          </CardTitle>
          <CardDescription className="text-gray-500">
            Tagesleistung Ihrer Shops mit Farbcodierung für Top-Performer
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('shopName', 'today')}
                  >
                    Shop-Name {todaySortField === 'shopName' && (todaySortDirection === 'desc' ? '↓' : '↑')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none text-right"
                    onClick={() => handleSort('todayOrders', 'today')}
                  >
                    Bestellungen {todaySortField === 'todayOrders' && (todaySortDirection === 'desc' ? '↓' : '↑')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none text-right"
                    onClick={() => handleSort('todayRevenue', 'today')}
                  >
                    Umsatz {todaySortField === 'todayRevenue' && (todaySortDirection === 'desc' ? '↓' : '↑')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none text-right"
                    onClick={() => handleSort('todayAvgOrder', 'today')}
                  >
                    Ø Bestellwert {todaySortField === 'todayAvgOrder' && (todaySortDirection === 'desc' ? '↓' : '↑')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none text-right"
                    onClick={() => handleSort('conversionRate', 'today')}
                  >
                    Conversion Rate {todaySortField === 'conversionRate' && (todaySortDirection === 'desc' ? '↓' : '↑')}
                  </TableHead>
                  <TableHead className="text-center">Details</TableHead>
                  <TableHead className="text-center">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayData.filter(shop => shop.todayOrders > 0).map((shop) => (
                  <TableRow key={shop.shopId} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="font-medium text-gray-900">{shop.shopName}</div>
                        <div className="text-sm text-gray-500">{shop.companyName}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={getPerformanceColor(shop.todayOrders, 'orders')}>
                        {shop.todayOrders}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={getPerformanceColor(shop.todayRevenue, 'revenue')}>
                        {formatCurrency(shop.todayRevenue)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(shop.todayAvgOrder)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {shop.conversionRate.toFixed(1)}%
                        {shop.conversionRate >= 50 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-center gap-2">
                          <Badge variant={shop.checkoutMode === 'instant' ? 'default' : 'secondary'} className="text-xs">
                            {shop.checkoutMode === 'instant' ? (
                              <><Zap className="h-3 w-3 mr-1" />Instant</>
                            ) : (
                              <><Clock className="h-3 w-3 mr-1" />Manual</>
                            )}
                          </Badge>
                          <Badge variant={shop.active ? 'default' : 'destructive'} className="text-xs">
                            {shop.active ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                          <Globe className="h-3 w-3" />
                          {shop.country}/{shop.language.toUpperCase()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Gesamt Performance */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-gray-100 rounded-2xl overflow-hidden">
        <Collapsible open={!isTotalCollapsed} onOpenChange={() => setIsTotalCollapsed(!isTotalCollapsed)}>
          <CardHeader className="bg-gradient-to-r from-gray-50/80 to-white">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                      <Store className="h-4 w-4 text-green-600" />
                    </div>
                    Shop-Performance (Gesamt)
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    Gesamtleistung Ihrer Shops mit Marktanteil und Trend-Analyse
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="ml-auto rounded-lg hover:bg-gray-100/80">
                  {isTotalCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-2">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50/80">
                    <TableRow className="hover:bg-transparent">
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleSort('shopName', 'total')}
                      >
                        Shop-Name {totalSortField === 'shopName' && (totalSortDirection === 'desc' ? '↓' : '↑')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none text-right"
                        onClick={() => handleSort('totalOrders', 'total')}
                      >
                        Total Bestellungen {totalSortField === 'totalOrders' && (totalSortDirection === 'desc' ? '↓' : '↑')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none text-right"
                        onClick={() => handleSort('totalRevenue', 'total')}
                      >
                        Total Umsatz {totalSortField === 'totalRevenue' && (totalSortDirection === 'desc' ? '↓' : '↑')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none text-right"
                        onClick={() => handleSort('totalAvgOrder', 'total')}
                      >
                        Ø Bestellwert {totalSortField === 'totalAvgOrder' && (totalSortDirection === 'desc' ? '↓' : '↑')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none text-right"
                        onClick={() => handleSort('revenuePercentage', 'total')}
                      >
                        Marktanteil {totalSortField === 'revenuePercentage' && (totalSortDirection === 'desc' ? '↓' : '↑')}
                      </TableHead>
                      <TableHead className="text-center">Best Day</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none text-center"
                        onClick={() => handleSort('last7DaysTrend', 'total')}
                      >
                        7-Tage Trend {totalSortField === 'last7DaysTrend' && (totalSortDirection === 'desc' ? '↓' : '↑')}
                      </TableHead>
                      <TableHead className="text-center">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {totalData.map((shop) => (
                      <TableRow key={shop.shopId} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="font-medium text-gray-900">{shop.shopName}</div>
                            <div className="text-sm text-gray-500">{shop.companyName}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={getPerformanceColor(shop.totalOrders, 'orders')}>
                            {shop.totalOrders}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={getPerformanceColor(shop.totalRevenue, 'revenue')}>
                            {formatCurrency(shop.totalRevenue)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(shop.totalAvgOrder)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-medium">{shop.revenuePercentage.toFixed(1)}%</span>
                            <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                              <div 
                                className="bg-blue-600 h-1 rounded-full" 
                                style={{ width: `${Math.min(shop.revenuePercentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col text-sm">
                            <span className="font-medium">{formatDate(shop.bestDay)}</span>
                            <span className="text-gray-500">{formatCurrency(shop.bestDayRevenue)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {shop.last7DaysTrend >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            <span className={`text-sm font-medium ${shop.last7DaysTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {shop.last7DaysTrend >= 0 ? '+' : ''}{shop.last7DaysTrend.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
