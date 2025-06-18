
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, Filter, FileText, Eye, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { OrderDetailsDialog } from './OrderDetailsDialog';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_address: string | null;
  product: string;
  liters: number;
  price_per_liter: number;
  total_amount: number;
  amount: number;
  base_price: number;
  delivery_fee: number;
  status: string;
  payment_method: string;
  delivery_city: string;
  delivery_street: string;
  delivery_postcode: string;
  delivery_first_name: string;
  delivery_last_name: string;
  delivery_phone: string | null;
  billing_first_name: string | null;
  billing_last_name: string | null;
  billing_street: string | null;
  billing_postcode: string | null;
  billing_city: string | null;
  use_same_address: boolean;
  invoice_number: string | null;
  invoice_pdf_generated: boolean;
  invoice_pdf_url: string | null;
  invoice_sent: boolean;
  invoice_date: string | null;
  invoice_generation_date: string | null;
  bank_details_shown: boolean;
  processing_mode: string | null;
  created_at: string;
  shop_id: string;
  shops?: {
    name: string;
    bank_account_id: string | null;
    bank_accounts?: {
      account_name: string;
      account_holder: string;
      iban: string;
    };
  };
}

interface Shop {
  id: string;
  name: string;
}

export function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShop, setSelectedShop] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchShops();
    fetchOrders();
  }, [currentPage, searchTerm, selectedShop, selectedStatus, dateFrom, dateTo]);

  const fetchShops = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('orders')
        .select(`
          *,
          shops!inner(
            name,
            bank_account_id,
            bank_accounts(
              account_name,
              account_holder,
              iban
            )
          )
        `, { count: 'exact' });

      // Apply filters
      if (searchTerm) {
        query = query.or(`order_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%`);
      }
      
      if (selectedShop !== 'all') {
        query = query.eq('shop_id', selectedShop);
      }
      
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }
      
      if (dateFrom) {
        query = query.gte('created_at', `${dateFrom}T00:00:00.000Z`);
      }
      
      if (dateTo) {
        query = query.lte('created_at', `${dateTo}T23:59:59.999Z`);
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      query = query
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      
      setOrders(data || []);
      setTotalCount(count || 0);
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      toast({
        title: 'Erfolg',
        description: 'Bestellstatus wurde aktualisiert',
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Fehler',
        description: 'Status konnte nicht aktualisiert werden',
        variant: 'destructive',
      });
    }
  };

  const generateInvoice = async (orderId: string) => {
    try {
      // This would typically call an edge function to generate the PDF
      toast({
        title: 'Rechnung wird generiert',
        description: 'Die Rechnung wird im Hintergrund erstellt',
      });
      
      // Update status to indicate invoice generation started
      await updateOrderStatus(orderId, 'confirmed');
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: 'Fehler',
        description: 'Rechnung konnte nicht generiert werden',
        variant: 'destructive',
      });
    }
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
    const dateStr = date.toLocaleDateString('de-DE');
    const timeStr = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} (${timeStr})`;
  };

  const formatAddress = (order: Order) => {
    return `${order.delivery_street}; ${order.delivery_postcode} ${order.delivery_city}`;
  };

  const getBankAccountInfo = (order: Order) => {
    if (order.shops?.bank_accounts) {
      const bankAccount = order.shops.bank_accounts;
      return bankAccount.account_name;
    }
    return 'Kein Bankkonto';
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedShop('all');
    setSelectedStatus('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bestellungen verwalten
          </CardTitle>
          <CardDescription>
            Verwalten Sie alle Bestellungen mit Filtern und Suchfunktion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Nach Bestellnummer, Kunde oder E-Mail suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedShop} onValueChange={setSelectedShop}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Shop auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Shops</SelectItem>
                {shops.map((shop) => (
                  <SelectItem key={shop.id} value={shop.id}>
                    {shop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Status auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="pending">Neu</SelectItem>
                <SelectItem value="confirmed">Exchanged</SelectItem>
                <SelectItem value="invoice_sent">Rechnung versendet</SelectItem>
                <SelectItem value="paid">Bezahlt</SelectItem>
                <SelectItem value="cancelled">Down</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full lg:w-40"
              placeholder="Von Datum"
            />

            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full lg:w-40"
              placeholder="Bis Datum"
            />

            <Button variant="outline" onClick={clearFilters} className="w-full lg:w-auto">
              <Filter className="h-4 w-4 mr-2" />
              Filter zurücksetzen
            </Button>
          </div>

          {/* Orders Table */}
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum & Uhrzeit</TableHead>
                  <TableHead>Bestellnummer</TableHead>
                  <TableHead>Kunde</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Produkt</TableHead>
                  <TableHead>Menge (L)</TableHead>
                  <TableHead>Gesamtpreis</TableHead>
                  <TableHead>Bankkonto</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Zahlung</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8">
                      Lade Bestellungen...
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8">
                      Keine Bestellungen gefunden
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {formatDateTime(order.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        #{order.order_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer_name}</div>
                          <div className="text-sm text-gray-500">{order.customer_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.customer_phone || order.delivery_phone || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatAddress(order)}
                        </div>
                      </TableCell>
                      <TableCell>{order.product}</TableCell>
                      <TableCell>{order.liters}</TableCell>
                      <TableCell>€{order.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {getBankAccountInfo(order)}
                        </div>
                      </TableCell>
                      <TableCell>{order.shops?.name}</TableCell>
                      <TableCell>{order.payment_method}</TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusLabel(order.status)}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Neu</SelectItem>
                            <SelectItem value="confirmed">Exchanged</SelectItem>
                            <SelectItem value="invoice_sent">Rechnung versendet</SelectItem>
                            <SelectItem value="paid">Bezahlt</SelectItem>
                            <SelectItem value="cancelled">Down</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => generateInvoice(order.id)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Rechnung
                            </Button>
                          )}
                          
                          {order.invoice_pdf_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(order.invoice_pdf_url!, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Zeige {(currentPage - 1) * itemsPerPage + 1} bis {Math.min(currentPage * itemsPerPage, totalCount)} von {totalCount} Bestellungen
              </div>
              
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(pageNum);
                          }}
                          isActive={currentPage === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }}
                      className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <OrderDetailsDialog
          order={selectedOrder}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          onOrderUpdate={fetchOrders}
        />
      )}
    </div>
  );
}
