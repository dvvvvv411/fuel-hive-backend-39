
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, RefreshCw, FileText, Eye, Download, DollarSign, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { OrderDetailsDialog } from './OrderDetailsDialog';
import { BankAccountSelectionDialog } from './BankAccountSelectionDialog';
import { PDFViewerDialog } from './PDFViewerDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
  const [showBankAccountDialog, setShowBankAccountDialog] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [selectedPDFOrder, setSelectedPDFOrder] = useState<Order | null>(null);
  
  // Filter states - changed to arrays for multi-select
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchShops();
    fetchOrders();
  }, [currentPage, searchTerm, selectedShops, selectedStatuses, dateFrom, dateTo]);

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
      
      if (selectedShops.length > 0) {
        query = query.in('shop_id', selectedShops);
      }
      
      if (selectedStatuses.length > 0) {
        query = query.in('status', selectedStatuses);
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

  const markAsPaid = async (orderId: string) => {
    await updateOrderStatus(orderId, 'paid');
  };

  const markAsExchanged = async (orderId: string) => {
    await updateOrderStatus(orderId, 'confirmed');
  };

  const generateInvoice = async (orderId: string, bankAccountId?: string) => {
    try {
      console.log('Calling generate-invoice edge function for order:', orderId);
      
      toast({
        title: 'Rechnung wird generiert',
        description: 'Die Rechnung wird erstellt und per E-Mail versendet',
      });

      // Call the edge function to generate the invoice
      const { data: invoiceData, error: invoiceError } = await supabase.functions.invoke('generate-invoice', {
        body: { order_id: orderId }
      });

      if (invoiceError) {
        console.error('Error calling generate-invoice function:', invoiceError);
        throw invoiceError;
      }

      console.log('Invoice generation response:', invoiceData);

      // Now automatically send the email with the invoice PDF
      console.log('Sending invoice email for order:', orderId);
      
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-order-confirmation', {
        body: { 
          order_id: orderId,
          include_invoice: true,
          email_type: 'instant_confirmation'
        }
      });

      if (emailError) {
        console.error('Error sending invoice email:', emailError);
        // Don't throw here - invoice was generated successfully, just email failed
        toast({
          title: 'Warnung',
          description: 'Rechnung wurde generiert, aber E-Mail konnte nicht versendet werden',
          variant: 'destructive',
        });
      } else {
        console.log('Invoice email sent successfully:', emailData);
      }

      // Update local state directly instead of refetching all orders
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.id === orderId) {
            return {
              ...order,
              status: 'invoice_sent',
              invoice_sent: true,
              invoice_number: invoiceData.invoice_number,
              invoice_pdf_generated: true,
              invoice_pdf_url: invoiceData.invoice_url,
              invoice_generation_date: invoiceData.generated_at || new Date().toISOString(),
              invoice_date: new Date().toISOString().split('T')[0]
            };
          }
          return order;
        })
      );

      const successMessage = emailError 
        ? 'Rechnung wurde erfolgreich generiert (E-Mail-Versand fehlgeschlagen)'
        : 'Rechnung wurde erfolgreich generiert und per E-Mail versendet';

      toast({
        title: 'Erfolg',
        description: successMessage,
      });

    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: 'Fehler',
        description: 'Rechnung konnte nicht generiert werden',
        variant: 'destructive',
      });
    }
  };

  const handleInvoiceClick = (order: Order) => {
    setSelectedOrderForInvoice(order);
    setShowBankAccountDialog(true);
  };

  const handleBankAccountSelected = (bankAccountId: string) => {
    if (selectedOrderForInvoice) {
      generateInvoice(selectedOrderForInvoice.id, bankAccountId);
      setSelectedOrderForInvoice(null);
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
        return 'Bestätigt';
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
    return { dateStr, timeStr };
  };

  const formatAddress = (order: Order) => {
    return {
      street: order.delivery_street,
      cityPostcode: `${order.delivery_postcode} ${order.delivery_city}`
    };
  };

  const getBankAccountInfo = (order: Order) => {
    // If processing_mode is 'manual' and no invoice has been generated yet
    if (order.processing_mode === 'manual' && !order.invoice_number) {
      return 'Noch nicht zugewiesen';
    }
    
    // For all other cases (manual with invoice, instant mode, or fallback)
    if (order.shops?.bank_accounts) {
      const bankAccount = order.shops.bank_accounts;
      return bankAccount.account_name;
    }
    
    return 'Kein Bankkonto';
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleShopChange = (shopId: string, checked: boolean) => {
    if (checked) {
      setSelectedShops([...selectedShops, shopId]);
    } else {
      setSelectedShops(selectedShops.filter(id => id !== shopId));
    }
    setCurrentPage(1);
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      setSelectedStatuses([...selectedStatuses, status]);
    } else {
      setSelectedStatuses(selectedStatuses.filter(s => s !== status));
    }
    setCurrentPage(1);
  };

  const refreshOrders = () => {
    fetchOrders();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedShops([]);
    setSelectedStatuses([]);
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full lg:w-48">
                  {selectedShops.length === 0 ? 'Alle Shops' : 
                   selectedShops.length === 1 ? shops.find(s => s.id === selectedShops[0])?.name : 
                   `${selectedShops.length} Shops`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white">
                <div className="p-2 space-y-2">
                  {shops.map((shop) => (
                    <div key={shop.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`shop-${shop.id}`}
                        checked={selectedShops.includes(shop.id)}
                        onCheckedChange={(checked) => handleShopChange(shop.id, checked as boolean)}
                      />
                      <label htmlFor={`shop-${shop.id}`} className="text-sm cursor-pointer">
                        {shop.name}
                      </label>
                    </div>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full lg:w-48">
                  {selectedStatuses.length === 0 ? 'Alle Status' : 
                   selectedStatuses.length === 1 ? getStatusLabel(selectedStatuses[0]) : 
                   `${selectedStatuses.length} Status`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white">
                <div className="p-2 space-y-2">
                  {[
                    { value: 'pending', label: 'Neu' },
                    { value: 'invoice_sent', label: 'Rechnung versendet' },
                    { value: 'paid', label: 'Bezahlt' },
                    { value: 'confirmed', label: 'Bestätigt' },
                    { value: 'cancelled', label: 'Down' }
                  ].map((status) => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status.value}`}
                        checked={selectedStatuses.includes(status.value)}
                        onCheckedChange={(checked) => handleStatusChange(status.value, checked as boolean)}
                      />
                      <label htmlFor={`status-${status.value}`} className="text-sm cursor-pointer">
                        {status.label}
                      </label>
                    </div>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

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

            <Button variant="outline" onClick={refreshOrders} className="w-full lg:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
          </div>

          {/* Orders Table */}
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
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
                  orders.map((order) => {
                    const address = formatAddress(order);
                    const { dateStr, timeStr } = formatDateTime(order.created_at);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          <div className="text-sm">
                            <div>{dateStr}</div>
                            <div className="text-gray-500">{timeStr}</div>
                          </div>
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
                            <div>{address.street}</div>
                            <div>{address.cityPostcode}</div>
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
                              <SelectItem value="invoice_sent">Rechnung versendet</SelectItem>
                              <SelectItem value="paid">Bezahlt</SelectItem>
                              <SelectItem value="confirmed">Bestätigt</SelectItem>
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
                                onClick={() => handleInvoiceClick(order)}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Rechnung
                              </Button>
                            )}

                            {order.status === 'invoice_sent' && (
                              <Button
                                size="sm"
                                onClick={() => markAsPaid(order.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                            )}

                            {order.status === 'paid' && (
                              <Button
                                size="sm"
                                onClick={() => markAsExchanged(order.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {order.invoice_pdf_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPDFOrder(order);
                                  setShowPDFViewer(true);
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
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

      {/* Bank Account Selection Dialog */}
      {selectedOrderForInvoice && (
        <BankAccountSelectionDialog
          open={showBankAccountDialog}
          onOpenChange={setShowBankAccountDialog}
          onBankAccountSelected={handleBankAccountSelected}
          orderNumber={selectedOrderForInvoice.order_number}
        />
      )}

      {/* PDF Viewer Dialog */}
      {selectedPDFOrder && (
        <PDFViewerDialog
          open={showPDFViewer}
          onOpenChange={setShowPDFViewer}
          pdfUrl={selectedPDFOrder.invoice_pdf_url!}
          orderNumber={selectedPDFOrder.order_number}
        />
      )}
    </div>
  );
}
