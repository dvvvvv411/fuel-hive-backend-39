
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Building, CreditCard, Euro, TrendingUp, Store, Calendar, User, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  delivery_city: string;
  shops: {
    name: string;
  };
}

interface BankAccountDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankAccount: BankAccount | null;
}

export function BankAccountDetailsDialog({ open, onOpenChange, bankAccount }: BankAccountDetailsDialogProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [dailyUsage, setDailyUsage] = useState(0);
  const [usagePercentage, setUsagePercentage] = useState(0);

  useEffect(() => {
    if (bankAccount && open) {
      fetchOrders();
      fetchDailyUsage();
    }
  }, [bankAccount, open]);

  const fetchOrders = async () => {
    if (!bankAccount) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          customer_email,
          total_amount,
          status,
          created_at,
          delivery_city,
          shops!inner(name, bank_account_id)
        `)
        .eq('shops.bank_account_id', bankAccount.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Fehler',
        description: 'Bestellungen konnten nicht geladen werden',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyUsage = async () => {
    if (!bankAccount) return;

    try {
      const usage = await calculateDailyUsage(bankAccount.id);
      setDailyUsage(usage);
      
      if (bankAccount.daily_limit) {
        const percentage = getDailyUsagePercentage(usage, bankAccount.daily_limit);
        setUsagePercentage(percentage);
      }
    } catch (error) {
      console.error('Error fetching daily usage:', error);
    }
  };

  const maskIban = (iban: string) => {
    if (iban.length <= 8) return iban;
    return iban.substring(0, 4) + '*'.repeat(iban.length - 8) + iban.substring(iban.length - 4);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'invoice_sent':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Neu';
      case 'confirmed':
        return 'Exchanged';
      case 'invoice_sent':
        return 'Rechnung versendet';
      case 'paid':
        return 'Bezahlt';
      case 'cancelled':
        return 'Down';
      default:
        return status;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalOrderValue = orders.reduce((sum, order) => sum + order.total_amount, 0);

  if (!bankAccount) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Bankkonto Details - {bankAccount.account_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="h-5 w-5" />
                  Kontoinformationen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Kontoname</label>
                    <p className="font-medium">{bankAccount.account_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Kontoinhaber</label>
                    <p className="font-medium">{bankAccount.account_holder}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Bank</label>
                    <p className="font-medium">{bankAccount.bank_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Land</label>
                    <p className="font-medium">{bankAccount.country}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">IBAN</label>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded block">
                      {maskIban(bankAccount.iban)}
                    </code>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">BIC</label>
                    <p className="font-medium">{bankAccount.bic || 'Nicht angegeben'}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Status:</span>
                    <Badge variant={bankAccount.active ? "default" : "secondary"}>
                      {bankAccount.active ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {bankAccount.use_anyname ? (
                      <div className="flex items-center text-green-600">
                        <Store className="h-4 w-4 mr-1" />
                        <span className="text-sm">Shopname verwenden</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Kontoinhaber verwenden</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5" />
                  Nutzungsstatistiken
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tageslimit</label>
                  {bankAccount.daily_limit && bankAccount.daily_limit > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {formatCurrency(bankAccount.daily_limit, bankAccount.currency)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {usagePercentage.toFixed(1)}% genutzt
                        </span>
                      </div>
                      <Progress value={usagePercentage} className="h-3" />
                      <div className="text-sm text-gray-600">
                        Heute genutzt: {formatCurrency(dailyUsage, bankAccount.currency)}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Kein Limit gesetzt</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gesamte Bestellungen</label>
                    <p className="text-2xl font-bold">{orders.length}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gesamtwert</label>
                    <p className="text-2xl font-bold">
                      {formatCurrency(totalOrderValue, bankAccount.currency)}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Erstellt am</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{formatDateTime(bankAccount.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Zugehörige Bestellungen ({orders.length})
              </CardTitle>
              <CardDescription>
                Alle Bestellungen, die mit diesem Bankkonto verknüpft sind
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Lade Bestellungen...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Bestellungen gefunden</h3>
                  <p className="text-gray-500">
                    Dieses Bankkonto wurde noch nicht für Bestellungen verwendet
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bestellnummer</TableHead>
                        <TableHead>Kunde</TableHead>
                        <TableHead>Shop</TableHead>
                        <TableHead>Lieferort</TableHead>
                        <TableHead>Betrag</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Datum</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            #{order.order_number}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.customer_name}</div>
                              <div className="text-sm text-gray-500">{order.customer_email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{order.shops.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              {order.delivery_city}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(order.total_amount, bankAccount.currency)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusLabel(order.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDateTime(order.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
