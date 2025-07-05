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
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 50px 40px 30px 40px; text-align: center; background: ${accentColor}; border-radius: 12px 12px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; line-height: 1.2; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      ${shopName}
                    </h1>
                    <div style="margin: 20px 0 0 0; padding: 12px 24px; background-color: rgba(255,255,255,0.2); border-radius: 50px; display: inline-block;">
                      <span style="color: #ffffff; font-size: 18px; font-weight: 600;">
                        📞 Kontaktversuch
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 24px 0; color: #374151; font-size: 18px; line-height: 1.6;">
                      <strong>Liebe/r ${customerFirstName} ${customerLastName},</strong>
                    </p>
                    
                    <p style="margin: 0 0 32px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      wir haben versucht, Sie bezüglich Ihrer Heizöl-Bestellung zu kontaktieren, konnten Sie jedoch leider nicht erreichen.
                    </p>

                    <!-- Status Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; border: 2px solid #f59e0b; margin-bottom: 32px;">
                      <tr>
                        <td style="padding: 24px; text-align: center;">
                          <div style="color: #92400e; font-size: 16px; line-height: 1.6; font-weight: 600;">
                            ⚠️ Kontaktaufnahme erforderlich
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Urgent Notice Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%); border-radius: 12px; border: 2px solid #ef4444; margin-bottom: 32px;">
                      <tr>
                        <td style="padding: 30px; text-align: center;">
                          <h3 style="margin: 0 0 16px 0; color: #dc2626; font-size: 20px; font-weight: 700;">
                            🚨 Wichtiger Hinweis
                          </h3>
                          <p style="margin: 0; color: #991b1b; font-size: 16px; line-height: 1.6; font-weight: 600;">
                            Um Ihre Bestellung ordnungsgemäß abwickeln zu können, benötigen wir dringend Ihren Rückruf.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Contact Information Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; border: 2px solid #3b82f6; margin-bottom: 32px;">
                      <tr>
                        <td style="padding: 30px; text-align: center;">
                          <h3 style="margin: 0 0 20px 0; color: #1e40af; font-size: 22px; font-weight: 700;">
                            📞 Bitte rufen Sie uns zurück
                          </h3>
                          <p style="margin: 0 0 16px 0; color: #1e40af; font-size: 16px; font-weight: 600;">
                            <strong>Ihr Ansprechpartner:</strong> ${shopName}
                          </p>
                          ${shopPhone ? `
                            <div style="margin: 20px 0; padding: 16px; background-color: rgba(255,255,255,0.7); border-radius: 8px;">
                              <div style="color: ${accentColor}; font-size: 28px; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px;">
                                ${shopPhone}
                              </div>
                              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                                <small>Montag bis Freitag, 8:00 - 18:00 Uhr</small>
                              </p>
                            </div>
                          ` : `
                            <p style="color: #dc2626; font-weight: 600; font-size: 16px; margin: 0;">
                              Bitte beachten Sie die Kontaktdaten in Ihrer Bestellbestätigung.
                            </p>
                          `}
                        </td>
                      </tr>
                    </table>

                    <!-- Order Details Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 12px; border: 2px solid ${accentColor}; margin-bottom: 32px;">
                      <tr>
                        <td style="padding: 30px;">
                          <h2 style="margin: 0 0 24px 0; color: ${accentColor}; font-size: 20px; font-weight: 700; text-align: center;">
                            📋 Ihre Bestelldetails
                          </h2>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 15px; font-weight: 600; width: 40%;">Bestellnummer:</td>
                              <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700;">#${displayOrderNumber}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 15px; font-weight: 600;">Produkt:</td>
                              <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700;">${order.product}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 15px; font-weight: 600;">Menge:</td>
                              <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700;">${order.liters} Liter</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 15px; font-weight: 600;">Gesamtbetrag:</td>
                              <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700;">€${order.total_amount.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 15px; font-weight: 600;">Bestelldatum:</td>
                              <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700;">${new Date(order.created_at).toLocaleDateString('de-DE')}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0 0 32px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Wir freuen uns auf Ihren Anruf und stehen Ihnen gerne für alle Fragen zur Verfügung.
                    </p>

                    <p style="margin: 32px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6; text-align: center;">
                      <strong>Mit freundlichen Grüßen</strong><br>
                      <strong style="color: ${accentColor};">Ihr Team von ${shopName}</strong>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                    <div style="text-align: center; color: #6b7280; font-size: 13px; line-height: 1.5;">
                      <div style="margin-bottom: 8px;">
                        <strong>${shopName}</strong>
                      </div>
                      <div>
                        Diese E-Mail wurde automatisch generiert. Bei Fragen kontaktieren Sie uns bitte telefonisch.
                      </div>
                      <div style="margin-top: 8px;">
                        ${new Date().getFullYear()}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
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