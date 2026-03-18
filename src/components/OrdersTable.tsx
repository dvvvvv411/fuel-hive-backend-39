import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, RefreshCw, FileText, Eye, DollarSign, Check, EyeOff, Copy, Mail, Pencil, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { OrderDetailsDialog } from './OrderDetailsDialog';
import { BankAccountSelectionDialog } from './BankAccountSelectionDialog';
import { ContactAttemptEmailPreview } from './ContactAttemptEmailPreview';
import { AddressEditDialog } from './AddressEditDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatCurrencyWithEUR } from '@/utils/bankingUtils';
import { CurrencyDisplay } from './CurrencyDisplay';
import { useUserRole } from '@/hooks/useUserRole';

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

interface OrdersTableProps {
  initialStatusFilter?: string[];
}

export function OrdersTable({ initialStatusFilter = [] }: OrdersTableProps = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showBankAccountDialog, setShowBankAccountDialog] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [showEmailPreviewDialog, setShowEmailPreviewDialog] = useState(false);
  const [selectedOrderForEmail, setSelectedOrderForEmail] = useState<Order | null>(null);
  const [showAddressEditDialog, setShowAddressEditDialog] = useState(false);
  const [selectedOrderForAddress, setSelectedOrderForAddress] = useState<Order | null>(null);
  
  // Inline editing states for liters, product, and email
  const [editingLitersOrderId, setEditingLitersOrderId] = useState<string | null>(null);
  const [newLitersValue, setNewLitersValue] = useState<number>(0);
  const [editingProductOrderId, setEditingProductOrderId] = useState<string | null>(null);
  const [editingEmailOrderId, setEditingEmailOrderId] = useState<string | null>(null);
  const [newEmailValue, setNewEmailValue] = useState<string>('');
  
  // Filter states - changed to arrays for multi-select
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(initialStatusFilter);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  const { isCaller, allowedShopIds, hasAllShopsAccess, visibleFromDate, loading: roleLoading } = useUserRole();

  // Update filter when initialStatusFilter changes
  useEffect(() => {
    setSelectedStatuses(initialStatusFilter);
  }, [initialStatusFilter]);

  useEffect(() => {
    // Wait until role data is loaded before fetching orders
    if (roleLoading) return;
    
    fetchShops();
    fetchOrders();
  }, [currentPage, searchTerm, selectedShops, selectedStatuses, dateFrom, dateTo, showHidden, allowedShopIds, hasAllShopsAccess, visibleFromDate, roleLoading]);

  const fetchShops = async () => {
    try {
      let query = supabase
        .from('shops')
        .select('id, name')
        .eq('active', true);

      // Filter shops for callers with specific shop assignments
      if (!hasAllShopsAccess && allowedShopIds.length > 0) {
        query = query.in('id', allowedShopIds);
      }

      const { data, error } = await query.order('name');

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
      
      // Apply caller shop filter first (if caller has specific shop assignments)
      if (!hasAllShopsAccess && allowedShopIds.length > 0) {
        query = query.in('shop_id', allowedShopIds);
      }

      // Apply caller visible_from_date filter
      if (isCaller && visibleFromDate) {
        query = query.gte('created_at', `${visibleFromDate}T00:00:00.000Z`);
      }
      
      if (selectedShops.length > 0) {
        // If caller has shop restrictions, intersect with their allowed shops
        if (!hasAllShopsAccess && allowedShopIds.length > 0) {
          const filteredShops = selectedShops.filter(id => allowedShopIds.includes(id));
          if (filteredShops.length > 0) {
            query = query.in('shop_id', filteredShops);
          }
        } else {
          query = query.in('shop_id', selectedShops);
        }
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

  const updateOrderLiters = async (orderId: string, newLiters: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || newLiters <= 0) return;

    const newBasePrice = newLiters * order.price_per_liter;
    const newTotalAmount = newBasePrice + order.delivery_fee;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          liters: newLiters,
          base_price: newBasePrice,
          total_amount: newTotalAmount,
          amount: newBasePrice
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(o => 
        o.id === orderId 
          ? { ...o, liters: newLiters, base_price: newBasePrice, total_amount: newTotalAmount, amount: newBasePrice }
          : o
      ));

      toast({
        title: 'Erfolg',
        description: 'Menge wurde aktualisiert',
      });
    } catch (error) {
      console.error('Error updating liters:', error);
      toast({
        title: 'Fehler',
        description: 'Menge konnte nicht aktualisiert werden',
        variant: 'destructive',
      });
    }
    setEditingLitersOrderId(null);
  };

  const updateOrderEmail = async (orderId: string, newEmail: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('orders')
      .update({ customer_email: newEmail })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating email:', error);
      toast({
        title: 'Fehler',
        description: 'E-Mail konnte nicht aktualisiert werden',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Erfolg',
        description: 'E-Mail wurde aktualisiert',
      });
      fetchOrders();
    }
    setEditingEmailOrderId(null);
  };

  const updateOrderProduct = async (orderId: string, newProduct: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Premium pricing: +0.03€/L difference
    const premiumUpcharge = 0.03;
    let newPricePerLiter = order.price_per_liter;
    
    const currentIsStandard = order.product.toLowerCase().includes('standard');
    const newIsStandard = newProduct.toLowerCase().includes('standard');
    
    if (currentIsStandard && !newIsStandard) {
      // Upgrade to Premium
      newPricePerLiter = order.price_per_liter + premiumUpcharge;
    } else if (!currentIsStandard && newIsStandard) {
      // Downgrade to Standard
      newPricePerLiter = order.price_per_liter - premiumUpcharge;
    }

    const newBasePrice = order.liters * newPricePerLiter;
    const newTotalAmount = newBasePrice + order.delivery_fee;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          product: newProduct,
          price_per_liter: newPricePerLiter,
          base_price: newBasePrice,
          total_amount: newTotalAmount,
          amount: newBasePrice
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(o => 
        o.id === orderId 
          ? { ...o, product: newProduct, price_per_liter: newPricePerLiter, base_price: newBasePrice, total_amount: newTotalAmount, amount: newBasePrice }
          : o
      ));

      toast({
        title: 'Erfolg',
        description: 'Produkt wurde aktualisiert',
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'Fehler',
        description: 'Produkt konnte nicht aktualisiert werden',
        variant: 'destructive',
      });
    }
    setEditingProductOrderId(null);
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
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg shadow-gray-200/50 border border-gray-100 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-semibold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
            <FileText className="h-5 w-5 text-orange-500" />
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

          {/* Orders Cards */}
          <div className="space-y-4">
            {(loading || roleLoading) ? (
              <div className="text-center py-12 text-muted-foreground">Lade Bestellungen...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {showHidden ? 'Keine ausgeblendeten Bestellungen gefunden' : 'Keine Bestellungen gefunden'}
              </div>
            ) : (
              orders.map((order) => {
                const address = formatAddress(order);
                const { dateStr, timeStr } = formatDateTime(order.created_at);
                const hasAddressDifference = checkAddressDifference(order);
                const phoneNumber = order.customer_phone || order.delivery_phone;
                const bankAccountInfo = getBankAccountInfo(order);

                return (
                  <div
                    key={order.id}
                    className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-5 space-y-3"
                  >
                    {/* Row 1: Header — Order number, Product, Liters, Status */}
                    <div className="flex flex-wrap items-center gap-3 justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Order Number */}
                        <span className="font-semibold text-base">
                          #{getDisplayOrderNumber(order)}
                          {order.temp_order_number && (
                            <span className="text-xs text-muted-foreground ml-1">(Orig: #{order.order_number})</span>
                          )}
                        </span>

                        <span className="text-muted-foreground">·</span>

                        {/* Product (editable) */}
                        {editingProductOrderId === order.id ? (
                          <Select
                            defaultValue={order.product}
                            onValueChange={(value) => updateOrderProduct(order.id, value)}
                            open={true}
                            onOpenChange={(open) => !open && setEditingProductOrderId(null)}
                          >
                            <SelectTrigger className="w-40 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Standard Heizöl">Standard Heizöl</SelectItem>
                              <SelectItem value="Premium Heizöl">Premium Heizöl</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span
                            className="cursor-pointer hover:bg-orange-50 hover:text-orange-700 px-2 py-0.5 rounded transition-colors group inline-flex items-center gap-1 text-sm"
                            onClick={() => setEditingProductOrderId(order.id)}
                          >
                            {order.product}
                            <Pencil className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                        )}

                        <span className="text-muted-foreground">·</span>

                        {/* Liters (editable) */}
                        {editingLitersOrderId === order.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={newLitersValue}
                              onChange={(e) => setNewLitersValue(Number(e.target.value))}
                              className="w-20 h-8"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateOrderLiters(order.id, newLitersValue);
                                } else if (e.key === 'Escape') {
                                  setEditingLitersOrderId(null);
                                }
                              }}
                            />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              = {(newLitersValue * order.price_per_liter + order.delivery_fee).toFixed(2)}€
                            </span>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => updateOrderLiters(order.id, newLitersValue)}>
                              <Check className="h-3 w-3 text-green-600" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingLitersOrderId(null)}>
                              <X className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <span
                            className="cursor-pointer hover:bg-orange-50 hover:text-orange-700 px-2 py-0.5 rounded transition-colors group inline-flex items-center gap-1 text-sm font-medium"
                            onClick={() => {
                              setEditingLitersOrderId(order.id);
                              setNewLitersValue(order.liters);
                            }}
                          >
                            {order.liters}L
                            <Pencil className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                        )}
                      </div>

                      {/* Status */}
                      <div>
                        {isCaller ? (
                          (order.status === 'pending' || order.status === 'ready') ? (
                            <Select value={order.status} onValueChange={(value) => updateOrderStatus(order.id, value)}>
                              <SelectTrigger className="w-36 h-8">
                                <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Neu</SelectItem>
                                <SelectItem value="ready">Ready</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
                          )
                        ) : (
                          <Select value={order.status} onValueChange={(value) => updateOrderStatus(order.id, value)}>
                            <SelectTrigger className="w-36 h-8">
                              <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
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
                        )}
                      </div>
                    </div>

                    {/* Row 2: Customer info */}
                    <div className="flex flex-wrap items-start gap-x-6 gap-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">👤</span>
                        <div className="flex flex-wrap items-center gap-x-2">
                          {(order.billing_company_name || order.delivery_company_name) && (
                            <span className="font-semibold text-primary">{order.billing_company_name || order.delivery_company_name}</span>
                          )}
                          <span className="font-medium">{order.customer_name}</span>
                        </div>
                      </div>

                      {/* Email (editable) */}
                      <div className="flex items-center gap-1">
                        {editingEmailOrderId === order.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="email"
                              value={newEmailValue}
                              onChange={(e) => setNewEmailValue(e.target.value)}
                              className="h-7 text-sm w-48"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') updateOrderEmail(order.id, newEmailValue);
                                else if (e.key === 'Escape') setEditingEmailOrderId(null);
                              }}
                            />
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => updateOrderEmail(order.id, newEmailValue)}>
                              <Check className="h-3 w-3 text-green-600" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingEmailOrderId(null)}>
                              <X className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <span
                            className="text-muted-foreground cursor-pointer hover:bg-orange-50 hover:text-orange-700 px-1 py-0.5 rounded transition-colors group inline-flex items-center gap-1"
                            onClick={() => { setEditingEmailOrderId(order.id); setNewEmailValue(order.customer_email); }}
                            title="Klicken zum Bearbeiten"
                          >
                            {order.customer_email}
                            <Pencil className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                        )}
                      </div>

                      {/* Phone */}
                      {phoneNumber && (
                        <div
                          className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                          onClick={() => copyPhoneToClipboard(phoneNumber)}
                          title="Klicken zum Kopieren"
                        >
                          <span className="text-muted-foreground">📞</span>
                          <span>{phoneNumber}</span>
                          <Copy className="h-3 w-3 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Row 3: Address */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <div
                        className="flex items-center gap-1 cursor-pointer hover:bg-orange-50 hover:text-orange-700 px-1 py-0.5 rounded transition-colors group"
                        onClick={() => { setSelectedOrderForAddress(order); setShowAddressEditDialog(true); }}
                        title="Klicken zum Bearbeiten"
                      >
                        <span className="text-muted-foreground">📍</span>
                        <span>{address.street}, {address.cityPostcode}</span>
                        <Pencil className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {hasAddressDifference && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          ⚠ Abweichende Rechnungsadresse
                        </span>
                      )}
                    </div>

                    {/* Row 4: Price, Payment, Bank, Shop, Date */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm border-t border-gray-100 pt-3">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">💰</span>
                        <CurrencyDisplay
                          amount={order.total_amount}
                          currency={order.currency || 'EUR'}
                          eurAmount={order.eur_amount}
                        />
                      </div>

                      <span className="text-muted-foreground">·</span>

                      <span>
                        {selectedStatuses.length === 1 && selectedStatuses[0] === 'invoice_sent' && order.invoice_generation_date
                          ? `RG: ${formatDateTime(order.invoice_generation_date).dateStr} ${formatDateTime(order.invoice_generation_date).timeStr}`
                          : order.payment_method}
                      </span>

                      {bankAccountInfo && (
                        <>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground">{bankAccountInfo}</span>
                        </>
                      )}

                      <span className="text-muted-foreground">·</span>

                      <span className="text-muted-foreground">🏪 {order.shops?.name}</span>

                      <span className="text-muted-foreground">·</span>

                      <span className="text-muted-foreground">{dateStr} {timeStr}</span>
                    </div>

                    {/* Row 5: Actions */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setSelectedOrder(order); setShowDetailsDialog(true); }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>

                      {(order.status === 'pending' || order.status === 'ready') && !showHidden && (
                        <>
                          {isCaller && order.status === 'pending' && (
                            <Button size="sm" onClick={() => markAsReady(order.id)} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                              Ready
                            </Button>
                          )}

                          {(!isCaller || order.status === 'ready') && (
                            <Button size="sm" onClick={() => handleInvoiceClick(order)}>
                              <FileText className="h-4 w-4 mr-1" />
                              Rechnung
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setSelectedOrderForEmail(order); setShowEmailPreviewDialog(true); }}
                            className="text-blue-600 hover:text-blue-700"
                            title="Kontaktversuch E-Mail"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {order.status === 'invoice_sent' && !showHidden && (
                        <Button size="sm" onClick={() => markAsPaid(order.id)} className="bg-green-600 hover:bg-green-700 text-white">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Bezahlt
                        </Button>
                      )}

                      {order.status === 'paid' && !showHidden && (
                        <Button size="sm" onClick={() => markAsExchanged(order.id)} className="bg-green-600 hover:bg-green-700 text-white">
                          <Check className="h-4 w-4 mr-1" />
                          Bestätigt
                        </Button>
                      )}

                      {!showHidden ? (
                        <Button variant="outline" size="sm" onClick={() => hideOrder(order.id)} className="text-orange-600 hover:text-orange-700">
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => showOrder(order.id)} className="text-green-600 hover:text-green-700">
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
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

      {/* Address Edit Dialog */}
      {selectedOrderForAddress && (
        <AddressEditDialog
          order={selectedOrderForAddress}
          open={showAddressEditDialog}
          onOpenChange={setShowAddressEditDialog}
          onSave={() => {
            fetchOrders();
            setShowAddressEditDialog(false);
          }}
        />
      )}
    </div>
  );
}
