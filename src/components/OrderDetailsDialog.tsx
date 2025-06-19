
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Package, 
  CreditCard, 
  FileText, 
  Calendar,
  Download,
  Send,
  DollarSign
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
  delivery_fee: number;
  base_price: number;
  status: string;
  payment_method: string;
  delivery_first_name: string;
  delivery_last_name: string;
  delivery_street: string;
  delivery_postcode: string;
  delivery_city: string;
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
  created_at: string;
  shops?: {
    name: string;
  };
}

interface OrderDetailsDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdate: () => void;
}

export function OrderDetailsDialog({ order, open, onOpenChange, onOrderUpdate }: OrderDetailsDialogProps) {
  const [updating, setUpdating] = useState(false);

  const updateOrderStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: 'Erfolg',
        description: 'Bestellstatus wurde aktualisiert',
      });
      
      onOrderUpdate();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Fehler',
        description: 'Status konnte nicht aktualisiert werden',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const sendOrderConfirmationEmail = async (emailType: 'manual_confirmation' | 'instant_confirmation', includeInvoice: boolean = false) => {
    try {
      setUpdating(true);
      
      console.log('Sending email:', emailType, 'with invoice:', includeInvoice);
      
      const { data, error } = await supabase.functions.invoke('send-order-confirmation', {
        body: {
          order_id: order.id,
          include_invoice: includeInvoice,
          email_type: emailType
        }
      });

      if (error) throw error;

      console.log('Email sent successfully:', data);

      toast({
        title: 'E-Mail versendet',
        description: `E-Mail wurde erfolgreich an ${order.customer_email} gesendet`,
      });

      // Refresh order data to get updated status
      onOrderUpdate();
      
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Fehler',
        description: `E-Mail konnte nicht versendet werden: ${error.message || 'Unbekannter Fehler'}`,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const generateInvoice = async () => {
    try {
      setUpdating(true);
      
      console.log('Starting invoice generation for order:', order.id);
      
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: { order_id: order.id }
      });

      if (error) {
        console.error('Invoice generation error:', error);
        throw error;
      }

      console.log('Invoice generation completed:', data);

      toast({
        title: 'Rechnung generiert',
        description: 'Die Rechnung wurde erfolgreich erstellt und der Status auf "Rechnung versendet" gesetzt',
      });
      
      // Now send the confirmation email with invoice
      console.log('Sending confirmation email with invoice');
      await sendOrderConfirmationEmail('instant_confirmation', true);
      
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: 'Fehler',
        description: `Rechnung konnte nicht generiert werden: ${error.message || 'Unbekannter Fehler'}`,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const sendInvoice = async () => {
    try {
      setUpdating(true);
      
      if (order.invoice_pdf_generated) {
        // Send email with existing invoice - status should already be invoice_sent
        console.log('Sending existing invoice via email');
        await sendOrderConfirmationEmail('instant_confirmation', true);
      } else {
        // Generate and send invoice - this will set status to invoice_sent
        console.log('Generating new invoice and sending');
        await generateInvoice();
      }
      
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast({
        title: 'Fehler',
        description: `Rechnung konnte nicht versendet werden: ${error.message || 'Unbekannter Fehler'}`,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const sendOrderReceiptEmail = async () => {
    try {
      setUpdating(true);
      await sendOrderConfirmationEmail('manual_confirmation', false);
    } catch (error) {
      console.error('Error sending order receipt email:', error);
      toast({
        title: 'Fehler',
        description: `Bestelleingang-E-Mail konnte nicht versendet werden: ${error.message || 'Unbekannter Fehler'}`,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const markAsPaid = async () => {
    await updateOrderStatus('paid');
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
        return 'Storniert';
      default:
        return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bestellung #{order.order_number}
          </DialogTitle>
          <DialogDescription>
            Detailansicht der Bestellung vom {new Date(order.created_at).toLocaleDateString('de-DE')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Status and Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status & Aktionen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-medium">Aktueller Status:</span>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  {order.status === 'pending' && (
                    <>
                      <Button 
                        variant="outline"
                        onClick={sendOrderReceiptEmail} 
                        disabled={updating}
                        size="sm"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Eingangsbestätigung senden
                      </Button>
                      <Button onClick={generateInvoice} disabled={updating} size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Rechnung erstellen
                      </Button>
                    </>
                  )}
                  
                  {order.status === 'confirmed' && (
                    <Button onClick={sendInvoice} disabled={updating} size="sm">
                      <Send className="h-4 w-4 mr-2" />
                      Rechnung versenden
                    </Button>
                  )}

                  {order.status === 'invoice_sent' && (
                    <>
                      <Button 
                        variant="outline"
                        onClick={() => sendOrderConfirmationEmail('instant_confirmation', true)} 
                        disabled={updating || !order.invoice_pdf_generated}
                        size="sm"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Rechnung erneut senden
                      </Button>
                      <Button 
                        onClick={markAsPaid} 
                        disabled={updating}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Als bezahlt markieren
                      </Button>
                    </>
                  )}
                  
                  {order.invoice_pdf_url && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(order.invoice_pdf_url!, '_blank')}
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF herunterladen
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-medium">Status ändern:</span>
                <Select value={order.status} onValueChange={updateOrderStatus} disabled={updating}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Neu</SelectItem>
                    <SelectItem value="confirmed">Bestätigt</SelectItem>
                    <SelectItem value="invoice_sent">Rechnung versendet</SelectItem>
                    <SelectItem value="paid">Bezahlt</SelectItem>
                    <SelectItem value="cancelled">Storniert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Email Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-Mail-Aktionen
              </CardTitle>
              <CardDescription>
                Versenden Sie E-Mails an den Kunden für verschiedene Bestellstatus
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={sendOrderReceiptEmail} 
                  disabled={updating}
                  className="w-full"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Bestelleingang bestätigen
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => sendOrderConfirmationEmail('instant_confirmation', order.invoice_pdf_generated)} 
                  disabled={updating || !order.invoice_pdf_generated}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Bestellbestätigung mit Rechnung
                </Button>
              </div>
              
              <p className="text-sm text-gray-600">
                E-Mails werden an <strong>{order.customer_email}</strong> gesendet
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Kundeninformationen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{order.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{order.customer_email}</span>
                </div>
                {order.customer_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{order.customer_phone}</span>
                  </div>
                )}
                {order.customer_address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{order.customer_address}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Bestellinformationen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Shop:</span>
                  <span className="font-medium">{order.shops?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Produkt:</span>
                  <span className="font-medium">{order.product}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Menge:</span>
                  <span className="font-medium">{order.liters} L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Preis pro Liter:</span>
                  <span className="font-medium">€{order.price_per_liter.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Liefergebühr:</span>
                  <span className="font-medium">€{order.delivery_fee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Gesamtbetrag:</span>
                  <span>€{order.total_amount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Lieferadresse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="font-medium">
                  {order.delivery_first_name} {order.delivery_last_name}
                </div>
                <div>{order.delivery_street}</div>
                <div>
                  {order.delivery_postcode} {order.delivery_city}
                </div>
                {order.delivery_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{order.delivery_phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Billing Address (if different) */}
          {!order.use_same_address && order.billing_street && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Rechnungsadresse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="font-medium">
                    {order.billing_first_name} {order.billing_last_name}
                  </div>
                  <div>{order.billing_street}</div>
                  <div>
                    {order.billing_postcode} {order.billing_city}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment and Invoice Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Zahlungsinformationen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <span className="text-gray-500">Zahlungsmethode:</span>
                  <span className="font-medium">{order.payment_method}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Rechnungsinformationen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.invoice_number && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rechnungsnummer:</span>
                    <span className="font-medium">{order.invoice_number}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-500">PDF Status:</span>
                  <Badge variant={order.invoice_pdf_generated ? "default" : "outline"}>
                    {order.invoice_pdf_generated ? "Erstellt" : "Nicht erstellt"}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Versendet:</span>
                  <Badge variant={order.invoice_sent ? "default" : "outline"}>
                    {order.invoice_sent ? "Ja" : "Nein"}
                  </Badge>
                </div>

                {order.invoice_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rechnungsdatum:</span>
                    <span className="font-medium">
                      {new Date(order.invoice_date).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Bestellverlauf
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Bestellung erstellt:</span>
                  <span className="font-medium">
                    {new Date(order.created_at).toLocaleString('de-DE')}
                  </span>
                </div>
                {order.invoice_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rechnung erstellt:</span>
                    <span className="font-medium">
                      {new Date(order.invoice_date).toLocaleString('de-DE')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
