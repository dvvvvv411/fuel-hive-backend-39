
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowRight, Clock, CheckCircle, FileText, CreditCard, AlertTriangle } from 'lucide-react';

interface StatusStats {
  status: string;
  count: number;
  todayCount: number;
  percentage: number;
  avgDaysInStatus: number;
  conversionRate: number;
}

interface ConversionStats {
  fromStatus: string;
  toStatus: string;
  rate: number;
  avgTime: number;
  count: number;
}

export function StatusPipelineAnalysis() {
  const [statusStats, setStatusStats] = useState<StatusStats[]>([]);
  const [conversionStats, setConversionStats] = useState<ConversionStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatusAnalysis();
  }, []);

  const fetchStatusAnalysis = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch all orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*');

      if (ordersError) throw ordersError;

      const totalOrders = orders?.length || 0;

      // Calculate status statistics
      const statusMap = new Map<string, {
        count: number;
        todayCount: number;
        totalDays: number;
      }>();

      orders?.forEach(order => {
        const status = order.status || 'unknown';
        const isToday = order.created_at?.startsWith(today);
        const daysSinceCreation = order.created_at ? 
          Math.floor((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;

        if (!statusMap.has(status)) {
          statusMap.set(status, { count: 0, todayCount: 0, totalDays: 0 });
        }

        const stats = statusMap.get(status)!;
        stats.count++;
        stats.totalDays += daysSinceCreation;
        
        if (isToday) {
          stats.todayCount++;
        }
      });

      // Convert to StatusStats array
      const statusStatsArray: StatusStats[] = Array.from(statusMap.entries()).map(([status, data]) => {
        const percentage = totalOrders > 0 ? (data.count / totalOrders) * 100 : 0;
        const avgDaysInStatus = data.count > 0 ? data.totalDays / data.count : 0;
        
        // Calculate conversion rate (simplified - orders that moved past this status)
        const statusOrder = ['pending', 'confirmed', 'invoice_sent', 'paid'];
        const currentIndex = statusOrder.indexOf(status);
        const nextStatusOrders = currentIndex >= 0 && currentIndex < statusOrder.length - 1 ? 
          statusMap.get(statusOrder[currentIndex + 1])?.count || 0 : 0;
        const conversionRate = data.count > 0 ? (nextStatusOrders / data.count) * 100 : 0;

        return {
          status,
          count: data.count,
          todayCount: data.todayCount,
          percentage,
          avgDaysInStatus,
          conversionRate: Math.min(conversionRate, 100) // Cap at 100%
        };
      });

      // Calculate conversion statistics between statuses
      const conversionStatsArray: ConversionStats[] = [
        {
          fromStatus: 'pending',
          toStatus: 'confirmed',
          rate: calculateConversionRate('pending', 'confirmed', orders || []),
          avgTime: calculateAvgConversionTime('pending', 'confirmed', orders || []),
          count: statusMap.get('confirmed')?.count || 0
        },
        {
          fromStatus: 'confirmed',
          toStatus: 'invoice_sent',
          rate: calculateConversionRate('confirmed', 'invoice_sent', orders || []),
          avgTime: calculateAvgConversionTime('confirmed', 'invoice_sent', orders || []),
          count: (orders || []).filter(order => order.invoice_sent).length
        },
        {
          fromStatus: 'invoice_sent',
          toStatus: 'paid',
          rate: calculateConversionRate('invoice_sent', 'paid', orders || []),
          avgTime: calculateAvgConversionTime('invoice_sent', 'paid', orders || []),
          count: statusMap.get('paid')?.count || 0
        }
      ];

      setStatusStats(statusStatsArray.sort((a, b) => {
        const statusOrder = ['pending', 'confirmed', 'invoice_sent', 'paid'];
        return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
      }));
      setConversionStats(conversionStatsArray);
    } catch (error) {
      console.error('Error fetching status analysis:', error);
      toast({
        title: "Fehler",
        description: "Status-Analyse konnte nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateConversionRate = (fromStatus: string, toStatus: string, orders: any[]) => {
    const fromCount = orders.filter(order => order.status === fromStatus).length;
    let toCount = 0;
    
    if (toStatus === 'invoice_sent') {
      toCount = orders.filter(order => order.invoice_sent && order.status !== 'pending').length;
    } else {
      toCount = orders.filter(order => order.status === toStatus).length;
    }
    
    return fromCount > 0 ? (toCount / fromCount) * 100 : 0;
  };

  const calculateAvgConversionTime = (fromStatus: string, toStatus: string, orders: any[]) => {
    // Simplified calculation - in real app you'd track status changes with timestamps
    const relevantOrders = orders.filter(order => {
      if (toStatus === 'invoice_sent') {
        return order.invoice_sent && order.status !== 'pending';
      }
      return order.status === toStatus;
    });

    if (relevantOrders.length === 0) return 0;

    const totalDays = relevantOrders.reduce((sum, order) => {
      const daysSinceCreation = order.created_at ? 
        Math.floor((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      return sum + daysSinceCreation;
    }, 0);

    return relevantOrders.length > 0 ? totalDays / relevantOrders.length : 0;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'invoice_sent':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'paid':
        return <CreditCard className="h-4 w-4 text-purple-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'invoice_sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paid':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ausstehend';
      case 'confirmed':
        return 'Bestätigt';
      case 'invoice_sent':
        return 'Rechnung versendet';
      case 'paid':
        return 'Bezahlt';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg shadow-gray-200/50 border border-gray-100 rounded-2xl">
          <CardHeader>
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-2/3"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalOrders = statusStats.reduce((sum, stat) => sum + stat.count, 0);
  const overallConversionRate = statusStats.find(stat => stat.status === 'paid')?.percentage || 0;

  return (
    <div className="space-y-6">
      {/* Pipeline Overview */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg shadow-gray-200/50 border border-gray-100 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
            Status-Pipeline Übersicht
          </CardTitle>
          <CardDescription>
            Bestellungsfluss und Conversion-Raten zwischen Status-Stufen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {statusStats.map((stat, index) => (
              <div key={stat.status} className="flex items-center gap-2">
                <div className={`p-4 rounded-lg border ${getStatusColor(stat.status)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(stat.status)}
                    <span className="font-medium">{getStatusLabel(stat.status)}</span>
                  </div>
                  <div className="text-2xl font-bold">{stat.count}</div>
                  <div className="text-sm opacity-75">
                    {stat.percentage.toFixed(1)}% | Heute: {stat.todayCount}
                  </div>
                  <div className="text-xs opacity-60 mt-1">
                    Ø {stat.avgDaysInStatus.toFixed(1)} Tage
                  </div>
                </div>
                {index < statusStats.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                )}
              </div>
            ))}
          </div>

          {/* Conversion Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {conversionStats.map((conversion) => (
              <div key={`${conversion.fromStatus}-${conversion.toStatus}`} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">
                    {getStatusLabel(conversion.fromStatus)} → {getStatusLabel(conversion.toStatus)}
                  </span>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {conversion.rate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">
                  Ø {conversion.avgTime.toFixed(1)} Tage | {conversion.count} Conversions
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(conversion.rate, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50/80 backdrop-blur-sm shadow-md border border-green-200 rounded-xl hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700">Gesamt Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {overallConversionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-green-600">
              von Bestellung zu Zahlung
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50/80 backdrop-blur-sm shadow-md border border-orange-200 rounded-xl hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700">Kritischer Punkt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-orange-900">
              {conversionStats.reduce((min, current) => 
                current.rate < min.rate ? current : min, conversionStats[0] || { rate: 0, fromStatus: '', toStatus: '' }
              ).rate.toFixed(1)}%
            </div>
            <div className="text-sm text-orange-600">
              Niedrigste Conversion-Rate
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50/80 backdrop-blur-sm shadow-md border border-blue-200 rounded-xl hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">Durchschnittliche Bearbeitungszeit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {conversionStats.reduce((sum, conv) => sum + conv.avgTime, 0) / Math.max(conversionStats.length, 1) || 0}
            </div>
            <div className="text-sm text-blue-600">
              Tage von Bestellung bis Zahlung
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
