
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  product: string;
  liters: number;
  price_per_liter: number;
  total_amount: number;
  status: string;
  payment_method: string;
  delivery_city: string;
  created_at: string;
}

export function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'default';
      case 'delivered':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Orders</h2>
          <p className="text-gray-600">Manage heating oil orders</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Order
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500 text-center mb-4">
              Orders will appear here once customers start placing them
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                    <CardDescription>{order.customer_name} • {order.customer_email}</CardDescription>
                  </div>
                  <Badge variant={getStatusColor(order.status) as any}>
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-1">Product</h4>
                    <p className="text-sm text-gray-600">{order.product}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-1">Quantity</h4>
                    <p className="text-sm text-gray-600">{order.liters} L</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-1">Total</h4>
                    <p className="text-sm text-gray-600">€{order.total_amount.toFixed(2)}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-1">Payment Method</h4>
                    <p className="text-sm text-gray-600">{order.payment_method}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-1">Delivery Location</h4>
                    <p className="text-sm text-gray-600">{order.delivery_city}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-1">Order Date</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
