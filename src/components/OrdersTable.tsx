import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, RefreshCw, FileText, Eye, DollarSign, Check, EyeOff, Copy, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { OrderDetailsDialog } from './OrderDetailsDialog';
import { BankAccountSelectionDialog } from './BankAccountSelectionDialog';
import { ContactAttemptEmailPreview } from './ContactAttemptEmailPreview';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatCurrencyWithEUR } from '@/utils/bankingUtils';
import { CurrencyDisplay } from './CurrencyDisplay';

interface Order {
  id: string;
  order_number: string;
  temp_order_number: string | null;
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
  currency?: string;
  eur_amount?: number;
  exchange_rate?: number;
  delivery_city: string;
  delivery_street: string;
  delivery_postcode: string;
  delivery_first_name: string;
  delivery_last_name: string;
  delivery_phone: string | null;
  delivery_company_name: string | null;
  billing_first_name: string | null;
  billing_last_name: string | null;
  billing_street: string | null;
  billing_postcode: string | null;
  billing_city: string | null;
  billing_company_name: string | null;
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
  hidden: boolean;
  selected_bank_account_id: string | null;
  shops?: {
    name: string;
    company_name: string;
    company_phone: string | null;
    support_phone: string | null;
    language: string;
    accent_color: string | null;
    bank_account_id: string | null;
    bank_accounts?: {
      account_name: string;
      account_holder: string;
      iban: string;
    };
  };
  temp_bank_accounts?: {
    account_name: string;
    account_holder: string;
    iban: string;
  }[];
  selected_bank_account?: {
    account_name: string;
    account_holder: string;
    iban: string;
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showBankAccountDialog, setShowBankAccountDialog] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [showEmailPreviewDialog, setShowEmailPreviewDialog] = useState(false);
  const [selectedOrderForEmail, setSelectedOrderForEmail] = useState<Order | null>(null);
  
  // Filter states - changed to arrays for multi-select
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchShops();
    fetchOrders();
  }, [currentPage, searchTerm, selectedShops, selectedStatuses, dateFrom, dateTo, showHidden]);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

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
            company_name,
            company_phone,
            support_phone,
            language,
            accent_color,
            bank_account_id,
            bank_accounts(
              account_name,
              account_holder,
              iban
            )
          ),
          temp_bank_accounts:bank_accounts!used_for_order_id(
            account_name,
            account_holder,
            iban
          ),
          selected_bank_account:bank_accounts!selected_bank_account_id(
            account_name,
            account_holder,
            iban
          )
        `, { count: 'exact' });

      // Filter by hidden status
      query = query.eq('hidden', showHidden);

      // Apply filters
      if (searchTerm) {
        query = query.or(`order_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%,billing_company_name.ilike.%${searchTerm}%,delivery_company_name.ilike.%${searchTerm}%`);
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

  const hideOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ hidden: true })
        .eq('id', orderId);

      if (error) throw error;

      // Remove order from current view
      setOrders(orders.filter(order => order.id !== orderId));

      toast({
        title: 'Erfolg',
        description: 'Bestellung wurde ausgeblendet',
      });
    } catch (error) {
      console.error('Error hiding order:', error);
      toast({
        title: 'Fehler',
        description: 'Bestellung konnte nicht ausgeblendet werden',
        variant: 'destructive',
      });
    }
  };

  const showOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ hidden: false })
        .eq('id', orderId);

      if (error) throw error;

      // Remove order from current view
      setOrders(orders.filter(order => order.id !== orderId));

      toast({
        title: 'Erfolg',
        description: 'Bestellung wird wieder angezeigt',
      });
    } catch (error) {
      console.error('Error showing order:', error);
      toast({
        title: 'Fehler',
        description: 'Bestellung konnte nicht wieder angezeigt werden',
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

  const markAsReady = async (orderId: string) => {
    await updateOrderStatus(orderId, 'ready');
  };

  const generateInvoice = async (
    orderId: string, 
    bankAccountId?: string, 
    newOrderNumber?: string,
    depositOptions?: { depositEnabled: boolean; depositNote?: string; depositPercentage?: number }
  ) => {
    try {
      console.log('Starting invoice generation for order:', orderId, 'with bank account:', bankAccountId, 'and new order number:', newOrderNumber);
      
      toast({
        title: 'Rechnung wird generiert',
        description: 'Die Rechnung wird erstellt und per E-Mail versendet',
      });

      // Step 1: Get bank account info to determine if it's temporary or existing
      let isTemporaryBankAccount = false;
      if (bankAccountId) {
        const { data: bankAccountData, error: bankAccountError } = await supabase
          .from('bank_accounts')
          .select('is_temporary')
          .eq('id', bankAccountId)
          .single();

        if (bankAccountError) {
          console.error('Error fetching bank account info:', bankAccountError);
        } else {
          isTemporaryBankAccount = bankAccountData.is_temporary;
          console.log('Bank account is temporary:', isTemporaryBankAccount);
        }
      }

      // Step 2: Update the order with selected bank account and order number if provided
      const updateData: any = {};
      
      if (newOrderNumber && newOrderNumber.trim() !== '') {
        updateData.order_number = newOrderNumber.trim();
      }
      
      // Always update selected_bank_account_id for both temporary and existing accounts
      if (bankAccountId) {
        updateData.selected_bank_account_id = bankAccountId;
      }

      if (Object.keys(updateData).length > 0) {
        console.log('Updating order with:', updateData);
        
        const { error: updateOrderError } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', orderId);

        if (updateOrderError) {
          console.error('Error updating order with selected bank account:', updateOrderError);
          throw updateOrderError;
        }

        console.log('Order updated successfully with selected bank account');
      }

      // Step 3: Get the order data 
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('processing_mode, order_number')
        .eq('id', orderId)
        .single();

      if (orderError) {
        console.error('Error fetching order data:', orderError);
        throw orderError;
      }

      console.log('Order data:', orderData);

      // Step 4: For temporary bank accounts, associate them with the order
      if (isTemporaryBankAccount && bankAccountId) {
        console.log('Associating temporary bank account with order');
        
        const { error: updateBankError } = await supabase
          .from('bank_accounts')
          .update({ 
            used_for_order_id: orderId,
            temp_order_number: orderData.order_number
          })
          .eq('id', bankAccountId)
          .eq('is_temporary', true);

        if (updateBankError) {
          console.error('Error updating temporary bank account:', updateBankError);
          throw updateBankError;
        }

        console.log('Successfully associated temporary bank account with order');
      } else if (bankAccountId) {
        console.log('Using existing (non-temporary) bank account:', bankAccountId);
      }

      // Step 5: Generate the invoice with the selected bank account
      console.log('Generating invoice');
      
      const { data: invoiceData, error: invoiceError } = await supabase.functions.invoke('generate-invoice', {
        body: { 
          order_id: orderId,
          bank_account_id: bankAccountId,
          deposit_note: depositOptions?.depositEnabled ? depositOptions.depositNote : undefined,
          deposit_percentage: depositOptions?.depositEnabled ? depositOptions.depositPercentage : undefined
        }
      });

      if (invoiceError) {
        console.error('Error calling generate-invoice function:', invoiceError);
        throw invoiceError;
      }

      console.log('Invoice generation response:', invoiceData);

      // Step 6: Send the email with the invoice PDF
      console.log('Sending invoice email for order:', orderId);
      
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-order-confirmation', {
        body: { 
          order_id: orderId,
          include_invoice: true,
          email_type: 'instant_confirmation',
          deposit_percentage: depositOptions?.depositEnabled ? depositOptions.depositPercentage : undefined
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

      // Step 7: Fetch the updated order data to get the selected bank account information
      const { data: updatedOrder, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          selected_bank_account:bank_accounts!selected_bank_account_id(
            account_name,
            account_holder,
            iban
          )
        `)
        .eq('id', orderId)
        .single();

      if (fetchError) {
        console.error('Error fetching updated order:', fetchError);
      }

      // Step 8: Update local state to reflect the changes
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
              invoice_date: new Date().toISOString().split('T')[0],
              order_number: newOrderNumber && newOrderNumber.trim() !== '' ? newOrderNumber.trim() : order.order_number,
              selected_bank_account_id: bankAccountId || order.selected_bank_account_id,
              // Update the selected bank account information if we have it
              selected_bank_account: updatedOrder?.selected_bank_account || order.selected_bank_account
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

  const handleBankAccountSelected = (
    bankAccountId: string, 
    newOrderNumber?: string,
    options?: { depositEnabled: boolean; depositNote?: string; depositPercentage?: number }
  ) => {
    if (selectedOrderForInvoice) {
      generateInvoice(selectedOrderForInvoice.id, bankAccountId, newOrderNumber, options);
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
      case 'ready':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
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
      case 'ready':
        return 'Ready';
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
    // Only show bank account info if an invoice has been generated
    if (!order.invoice_pdf_generated) {
      return '';
    }

    // Primary: Check for selected bank account (for orders with invoice generated)
    if (order.selected_bank_account) {
      return order.selected_bank_account.account_name;
    }
    
    // Fallback 1: Check for temporary bank account (for orders with temporary accounts)
    if (order.temp_bank_accounts && Array.isArray(order.temp_bank_accounts) && order.temp_bank_accounts.length > 0) {
      return order.temp_bank_accounts[0].account_name;
    }
    
    // Fallback 2: Check if shop has an assigned bank account (for older orders)
    if (order.shops?.bank_accounts) {
      const bankAccount = order.shops.bank_accounts;
      return bankAccount.account_name;
    }
    
    // If no bank account info is found despite having an invoice, show a placeholder
    return 'Nicht verfügbar';
  };

  const getDisplayOrderNumber = (order: Order) => {
    return order.temp_order_number || order.order_number;
  };

  const checkAddressDifference = (order: Order) => {
    // Check if billing address fields are provided (not null, undefined, or empty)
    const hasBillingAddress = order.billing_street && 
                             order.billing_city && 
                             order.billing_postcode &&
                             order.billing_street.trim() !== '' &&
                             order.billing_city.trim() !== '' &&
                             order.billing_postcode.trim() !== '';
    
    // If no billing address is provided, addresses are considered identical (return false for different)
    if (!hasBillingAddress) {
      return false;
    }
    
    // If billing address is provided, check if it's different from delivery address
    const isDifferent = order.billing_street !== order.delivery_street || 
                       order.billing_city !== order.delivery_city || 
                       order.billing_postcode !== order.delivery_postcode;
    
    return isDifferent;
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

  const copyPhoneToClipboard = async (phone: string) => {
    try {
      // Primary method: Modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(phone);
        toast({
          title: 'Kopiert',
          description: 'Telefonnummer wurde in die Zwischenablage kopiert',
        });
        return;
      }
      
      // Fallback method: document.execCommand with temporary textarea
      const textArea = document.createElement('textarea');
      textArea.value = phone;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        toast({
          title: 'Kopiert',
          description: 'Telefonnummer wurde in die Zwischenablage kopiert',
        });
      } else {
        throw new Error('execCommand failed');
      }
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      toast({
        title: 'Fehler',
        description: 'Telefonnummer konnte nicht kopiert werden. Bitte manuell kopieren.',
        variant: 'destructive',
      });
    }
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
                    { value: 'ready', label: 'Ready' },
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

            <Button 
              variant={showHidden ? "default" : "outline"} 
              onClick={() => setShowHidden(!showHidden)}
              className="w-full lg:w-auto"
            >
              <EyeOff className="h-4 w-4 mr-2" />
              {showHidden ? 'Normale anzeigen' : 'Ausgeblendete anzeigen'}
            </Button>

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
                  <TableHead>Abw.</TableHead>
                  <TableHead>Produkt</TableHead>
                  <TableHead>Menge (L)</TableHead>
                  <TableHead>Gesamtpreis</TableHead>
                  <TableHead>Bankkonto</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>
                    {selectedStatuses.length === 1 && selectedStatuses[0] === 'invoice_sent' ? 'RG-Datum' : 'Zahlung'}
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-8">
                      Lade Bestellungen...
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-8">
                      {showHidden ? 'Keine ausgeblendeten Bestellungen gefunden' : 'Keine Bestellungen gefunden'}
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => {
                    const address = formatAddress(order);
                    const { dateStr, timeStr } = formatDateTime(order.created_at);
                    const hasAddressDifference = checkAddressDifference(order);
                    const phoneNumber = order.customer_phone || order.delivery_phone;
                    const bankAccountInfo = getBankAccountInfo(order);
                    
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          <div className="text-sm">
                            <div>{dateStr}</div>
                            <div className="text-gray-500">{timeStr}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>
                            <div>#{getDisplayOrderNumber(order)}</div>
                            {order.temp_order_number && (
                              <div className="text-xs text-gray-500">
                                Original: #{order.order_number}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            {(order.billing_company_name || order.delivery_company_name) && (
                              <div className="font-semibold text-primary">
                                {order.billing_company_name || order.delivery_company_name}
                              </div>
                            )}
                            <div className="font-medium">{order.customer_name}</div>
                            <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {phoneNumber ? (
                            <div 
                              className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 p-1 rounded"
                              onClick={() => copyPhoneToClipboard(phoneNumber)}
                              title="Klicken zum Kopieren"
                            >
                              <span>{phoneNumber}</span>
                              <Copy className="h-3 w-3 text-gray-400" />
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{address.street}</div>
                            <div>{address.cityPostcode}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <div 
                              className={`w-3 h-3 rounded-full ${hasAddressDifference ? 'bg-green-500' : 'bg-red-500'}`}
                              title={hasAddressDifference ? 'Rechnungsadresse weicht ab' : 'Rechnungsadresse identisch'}
                            />
                          </div>
                        </TableCell>
                        <TableCell>{order.product}</TableCell>
                        <TableCell>{order.liters}</TableCell>
                        <TableCell>
                          <CurrencyDisplay
                            amount={order.total_amount}
                            currency={order.currency || 'EUR'}
                            eurAmount={order.eur_amount}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {bankAccountInfo || (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{order.shops?.name}</TableCell>
                        <TableCell>
                          {selectedStatuses.length === 1 && selectedStatuses[0] === 'invoice_sent' && order.invoice_generation_date ? (
                            <div className="text-sm">
                              <div>{formatDateTime(order.invoice_generation_date).dateStr}</div>
                              <div className="text-gray-500">{formatDateTime(order.invoice_generation_date).timeStr}</div>
                            </div>
                          ) : (
                            order.payment_method
                          )}
                        </TableCell>
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
                              <SelectItem value="ready">Ready</SelectItem>
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
                            
                            {(order.status === 'pending' || order.status === 'ready') && !showHidden && (
                              <>
                                {/* Show Ready button only for special user AND pending status */}
                                {currentUser?.id === '3338709d-0620-4384-8705-f6b4e9bf8be6' && order.status === 'pending' ? (
                                  // Ready Button for special user at pending status
                                  <Button
                                    size="sm"
                                    onClick={() => markAsReady(order.id)}
                                    className="bg-cyan-500 hover:bg-cyan-600 text-white"
                                  >
                                    Ready
                                  </Button>
                                ) : (
                                  // Rechnung Button for all users at "ready" status or normal users at "pending" status
                                  <Button
                                    size="sm"
                                    onClick={() => handleInvoiceClick(order)}
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    Rechnung
                                  </Button>
                                )}
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedOrderForEmail(order);
                                    setShowEmailPreviewDialog(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-700"
                                  title="Kontaktversuch E-Mail Vorschau"
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              </>
                            )}

                            {order.status === 'invoice_sent' && !showHidden && (
                              <Button
                                size="sm"
                                onClick={() => markAsPaid(order.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                            )}

                            {order.status === 'paid' && !showHidden && (
                              <Button
                                size="sm"
                                onClick={() => markAsExchanged(order.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}

                            {!showHidden ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => hideOrder(order.id)}
                                className="text-orange-600 hover:text-orange-700"
                              >
                                <EyeOff className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => showOrder(order.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Eye className="h-4 w-4" />
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

      {/* Contact Attempt Email Preview Dialog */}
      <ContactAttemptEmailPreview
        open={showEmailPreviewDialog}
        onOpenChange={setShowEmailPreviewDialog}
        order={selectedOrderForEmail}
      />
    </div>
  );
}
