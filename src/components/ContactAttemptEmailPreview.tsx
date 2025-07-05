import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  order_number: string;
  temp_order_number: string | null;
  customer_name: string;
  customer_email: string;
  product: string;
  liters: number;
  total_amount: number;
  delivery_first_name: string;
  delivery_last_name: string;
  created_at: string;
  shops?: {
    name: string;
    company_name: string;
    company_phone: string | null;
    support_phone: string | null;
    language: string;
    accent_color: string | null;
  };
}

interface ContactAttemptEmailPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export function ContactAttemptEmailPreview({ open, onOpenChange, order }: ContactAttemptEmailPreviewProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!order) return null;

  const shopName = order.shops?.company_name || order.shops?.name || 'Heizöl-Service';
  const shopPhone = order.shops?.support_phone || order.shops?.company_phone;
  const language = order.shops?.language || 'de';
  const accentColor = order.shops?.accent_color || '#2563eb';
  const displayOrderNumber = order.temp_order_number || order.order_number;
  const customerFirstName = order.delivery_first_name;
  const customerLastName = order.delivery_last_name;

  // German contact attempt email template
  const getContactAttemptTemplate = () => {
    const subject = `Kontaktversuch - Ihre Heizöl-Bestellung #${displayOrderNumber} bei ${shopName}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kontaktversuch - Bestellung #${displayOrderNumber}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .email-container {
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, ${accentColor}, ${accentColor}dd);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 30px;
          }
          .status-badge {
            background-color: #fef3c7;
            color: #92400e;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            display: inline-block;
            margin: 20px 0;
          }
          .order-details {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: 500;
            color: #475569;
          }
          .detail-value {
            color: #1e293b;
          }
          .contact-info {
            background-color: #dbeafe;
            border: 1px solid #93c5fd;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
          .phone-number {
            font-size: 18px;
            font-weight: 600;
            color: ${accentColor};
            margin: 10px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            background-color: #f1f5f9;
            color: #64748b;
            font-size: 14px;
          }
          .important-notice {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
          }
          .important-notice h3 {
            color: #dc2626;
            margin: 0 0 10px 0;
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>📞 Kontaktversuch</h1>
            <p>Bestellung #${displayOrderNumber}</p>
          </div>
          
          <div class="content">
            <p><strong>Liebe/r ${customerFirstName} ${customerLastName},</strong></p>
            
            <p>wir haben versucht, Sie bezüglich Ihrer Heizöl-Bestellung zu kontaktieren, konnten Sie jedoch leider nicht erreichen.</p>
            
            <div class="status-badge">
              ⚠️ Kontaktaufnahme erforderlich
            </div>
            
            <div class="order-details">
              <h3 style="margin-top: 0; color: #1e293b;">📋 Ihre Bestelldetails</h3>
              <div class="detail-row">
                <span class="detail-label">Bestellnummer:</span>
                <span class="detail-value">#${displayOrderNumber}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Produkt:</span>
                <span class="detail-value">${order.product}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Menge:</span>
                <span class="detail-value">${order.liters} Liter</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Gesamtbetrag:</span>
                <span class="detail-value">€${order.total_amount.toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Bestelldatum:</span>
                <span class="detail-value">${new Date(order.created_at).toLocaleDateString('de-DE')}</span>
              </div>
            </div>
            
            <div class="important-notice">
              <h3>🚨 Wichtiger Hinweis</h3>
              <p>Um Ihre Bestellung ordnungsgemäß abwickeln zu können, benötigen wir dringend Ihren Rückruf. Bitte kontaktieren Sie uns schnellstmöglich unter der unten angegebenen Telefonnummer.</p>
            </div>
            
            <div class="contact-info">
              <h3 style="margin-top: 0; color: #1e293b;">📞 Bitte rufen Sie uns zurück</h3>
              <p><strong>Ihr Ansprechpartner:</strong> ${shopName}</p>
              ${shopPhone ? `
                <div class="phone-number">
                  <Phone style="display: inline; width: 18px; height: 18px; margin-right: 8px;" />
                  ${shopPhone}
                </div>
                <p style="margin-bottom: 0;"><small>Montag bis Freitag, 8:00 - 18:00 Uhr</small></p>
              ` : `
                <p style="color: #dc2626; font-weight: 500;">Bitte beachten Sie die Kontaktdaten in Ihrer Bestellbestätigung.</p>
              `}
            </div>
            
            <p>Wir freuen uns auf Ihren Anruf und stehen Ihnen gerne für alle Fragen zur Verfügung.</p>
            
            <p style="margin-top: 30px;">
              <strong>Mit freundlichen Grüßen</strong><br>
              Ihr Team von ${shopName}
            </p>
          </div>
          
          <div class="footer">
            <p>Diese E-Mail wurde automatisch generiert. Bei Fragen kontaktieren Sie uns bitte telefonisch.</p>
            <p>${shopName} | ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, htmlContent };
  };

  const handleSendEmail = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-contact-attempt-email', {
        body: { orderId: order.id }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "E-Mail gesendet",
        description: `Kontaktversuch-E-Mail wurde erfolgreich an ${order.customer_email} gesendet.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error sending contact attempt email:', error);
      toast({
        title: "Fehler beim Senden",
        description: error.message || "Die E-Mail konnte nicht gesendet werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const { subject, htmlContent } = getContactAttemptTemplate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            E-Mail Vorschau - Kontaktversuch
          </DialogTitle>
          <DialogDescription>
            Vorschau der E-Mail, die an den Kunden gesendet werden würde
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Email Subject */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-1">Betreff:</div>
            <div className="font-medium">{subject}</div>
          </div>

          {/* Email Content Preview */}
          <div className="border rounded-lg overflow-hidden">
            <div className="p-3 bg-gray-100 border-b">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">E-Mail Inhalt</div>
                <Badge variant="outline">Vorschau</Badge>
              </div>
            </div>
            <div 
              className="p-4 max-h-96 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <strong>Empfänger:</strong> {order.customer_email}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Schließen
              </Button>
              <Button 
                onClick={handleSendEmail}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="h-4 w-4 mr-2" />
                {loading ? 'Sende...' : 'Email senden'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}