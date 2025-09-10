
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Euro, FileText, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { LargeMetricCard } from './LargeMetricCard';
import { SimpleStatusCards } from './SimpleStatusCards';
import { SimpleProductStats } from './SimpleProductStats';

interface DashboardData {
  todayRevenue: number;
  totalRevenue: number;
  todayOrders: number;
  totalOrders: number;
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

  const getConversionRate = () => {
    if (!data || data.totalOrders === 0) return 0;
    const paidOrders = data.statusStats.paid.total;
    return (paidOrders / data.totalOrders) * 100;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-4">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-12 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-4 bg-gray-100 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const conversionRate = getConversionRate();

  return (
    <div className="space-y-10">
      {/* Haupt-Statistiken - Große Karten */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Haupt-Statistiken</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <LargeMetricCard
            title="Umsatz Heute"
            mainValue={formatCurrency(data.todayRevenue)}
            secondaryValue={`Gesamt: ${formatCurrency(data.totalRevenue)}`}
            icon={Euro}
            iconColor="text-green-600"
            iconBgColor="bg-green-50"
          />
          
          <LargeMetricCard
            title="Bestellungen Heute"
            mainValue={formatNumber(data.todayOrders)}
            secondaryValue={`Gesamt: ${formatNumber(data.totalOrders)}`}
            icon={FileText}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-50"
          />
          
          <LargeMetricCard
            title="Conversion Rate"
            mainValue={`${conversionRate.toFixed(1)}%`}
            secondaryValue={`${data.statusStats.paid.total} von ${data.totalOrders} Bestellungen`}
            icon={TrendingUp}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-50"
          />
        </div>
      </div>

      {/* Status-Übersicht */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Status-Übersicht</h3>
        <SimpleStatusCards statusStats={data.statusStats} />
      </div>

      {/* Produktstatistiken */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Produktstatistiken</h3>
        <SimpleProductStats productStats={data.productStats} totalOrders={data.totalOrders} />
      </div>
    </div>
  );
}
