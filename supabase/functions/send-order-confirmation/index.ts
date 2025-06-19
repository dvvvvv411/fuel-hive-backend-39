
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  order_id: string;
  include_invoice: boolean;
  email_type: 'instant_confirmation' | 'manual_confirmation';
}

const generateEmailTemplate = (order: any, emailType: string) => {
  const shopName = order.shops?.company_name || order.shops?.name || 'Heizöl-Service';
  const accentColor = order.shops?.accent_color || '#2563eb';
  const logoUrl = order.shops?.logo_url;
  
  const isInstant = emailType === 'instant_confirmation';
  
  const subject = isInstant 
    ? `Bestellbestätigung ${order.order_number} - Ihre Heizöl-Bestellung`
    : `Bestelleingang ${order.order_number} - Ihre Heizöl-Bestellung`;

  const statusMessage = isInstant
    ? 'Ihre Bestellung wird automatisch bearbeitet. Die Rechnung finden Sie im Anhang dieser E-Mail.'
    : 'Ihre Bestellung wird manuell geprüft. Sie erhalten eine Bestätigung und Rechnung, sobald Ihre Bestellung bearbeitet wurde.';

  const invoiceInfo = isInstant && order.invoice_number
    ? `<li><strong>Rechnungsnummer:</strong> ${order.invoice_number}</li>`
    : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
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
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%); border-radius: 8px 8px 0 0;">
                  ${logoUrl ? `<img src="${logoUrl}" alt="${shopName}" style="max-height: 60px; margin-bottom: 20px;">` : ''}
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; line-height: 1.2;">
                    ${isInstant ? 'Bestellung bestätigt!' : 'Bestellung erhalten!'}
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                    Liebe/r ${order.delivery_first_name} ${order.delivery_last_name},
                  </p>
                  
                  <p style="margin: 0 0 32px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                    ${isInstant 
                      ? 'vielen Dank für Ihre Bestellung! Ihre Heizöl-Bestellung wurde erfolgreich aufgegeben und wird automatisch bearbeitet.'
                      : 'vielen Dank für Ihre Bestellung! Wir haben Ihre Heizöl-Bestellung erhalten und werden sie schnellstmöglich bearbeiten.'
                    }
                  </p>

                  <!-- Order Details Box -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 24px;">
                        <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; font-weight: 600;">
                          Bestelldetails
                        </h2>
                        <ul style="margin: 0; padding: 0; list-style: none;">
                          <li style="margin-bottom: 12px; color: #374151; font-size: 15px;">
                            <strong>Bestellnummer:</strong> ${order.order_number}
                          </li>
                          ${invoiceInfo}
                          <li style="margin-bottom: 12px; color: #374151; font-size: 15px;">
                            <strong>Produkt:</strong> ${order.product}
                          </li>
                          <li style="margin-bottom: 12px; color: #374151; font-size: 15px;">
                            <strong>Menge:</strong> ${order.liters} Liter
                          </li>
                          <li style="margin-bottom: 12px; color: #374151; font-size: 15px;">
                            <strong>Preis pro Liter:</strong> €${order.price_per_liter.toFixed(2)}
                          </li>
                          ${order.delivery_fee > 0 ? `
                          <li style="margin-bottom: 12px; color: #374151; font-size: 15px;">
                            <strong>Liefergebühr:</strong> €${order.delivery_fee.toFixed(2)}
                          </li>
                          ` : ''}
                          <li style="margin-bottom: 0; color: #111827; font-size: 16px; font-weight: 600; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                            <strong>Gesamtbetrag:</strong> €${order.total_amount.toFixed(2)}
                          </li>
                        </ul>
                      </td>
                    </tr>
                  </table>

                  <!-- Delivery Address Box -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 24px;">
                        <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                          Lieferadresse
                        </h2>
                        <div style="color: #374151; font-size: 15px; line-height: 1.5;">
                          <div style="font-weight: 600; margin-bottom: 4px;">
                            ${order.delivery_first_name} ${order.delivery_last_name}
                          </div>
                          <div>${order.delivery_street}</div>
                          <div>${order.delivery_postcode} ${order.delivery_city}</div>
                          ${order.delivery_phone ? `<div style="margin-top: 8px;">Tel: ${order.delivery_phone}</div>` : ''}
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Status Box -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${isInstant ? '#ecfdf5' : '#fef3c7'}; border-radius: 8px; border: 1px solid ${isInstant ? '#10b981' : '#f59e0b'}; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 20px;">
                        <div style="color: ${isInstant ? '#047857' : '#92400e'}; font-size: 15px; line-height: 1.6;">
                          <strong>Status:</strong> ${statusMessage}
                        </div>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 0 0 8px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                    Bei Fragen kontaktieren Sie uns gerne:
                  </p>
                  <p style="margin: 0 0 32px 0; color: ${accentColor}; font-size: 16px; font-weight: 600;">
                    ${order.shops?.company_email}
                    ${order.shops?.support_phone ? ` • ${order.shops.support_phone}` : ''}
                  </p>

                  <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
                    Mit freundlichen Grüßen<br>
                    <strong>${shopName}</strong>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                  <div style="text-align: center; color: #6b7280; font-size: 13px; line-height: 1.5;">
                    <div style="margin-bottom: 8px;">
                      <strong>${shopName}</strong>
                    </div>
                    <div>
                      ${order.shops?.company_address || ''} • ${order.shops?.company_postcode || ''} ${order.shops?.company_city || ''}
                    </div>
                    ${order.shops?.vat_number ? `<div style="margin-top: 8px;">USt-IdNr: ${order.shops.vat_number}</div>` : ''}
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { order_id, include_invoice, email_type }: EmailRequest = await req.json();
    console.log('Sending confirmation email for order:', order_id, 'Type:', email_type, 'Include invoice:', include_invoice);

    // Get order with shop and resend config
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        shops (
          name,
          company_name,
          company_email,
          company_phone,
          company_address,
          company_city,
          company_postcode,
          vat_number,
          logo_url,
          accent_color,
          support_phone,
          resend_configs (
            resend_api_key,
            from_email,
            from_name
          )
        )
      `)
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const resendConfig = order.shops?.resend_configs;
    if (!resendConfig?.resend_api_key) {
      console.error('No Resend configuration found for shop');
      return new Response(JSON.stringify({ error: 'No email configuration found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Initialize Resend
    const resend = new Resend(resendConfig.resend_api_key);

    // Generate email template
    const { subject, htmlContent } = generateEmailTemplate(order, email_type);

    // Prepare email payload
    const emailPayload: any = {
      from: `${resendConfig.from_name} <${resendConfig.from_email}>`,
      to: [order.customer_email],
      subject: subject,
      html: htmlContent,
    };

    // Add PDF attachment for instant orders with invoices
    if (include_invoice && order.invoice_pdf_url && email_type === 'instant_confirmation') {
      try {
        console.log('Adding PDF attachment for invoice:', order.invoice_number);
        
        // Download PDF from Supabase Storage
        const fileName = order.invoice_pdf_url.split('/').pop() || '';
        const { data: pdfData, error: downloadError } = await supabase.storage
          .from('invoices')
          .download(fileName);

        if (!downloadError && pdfData) {
          // Convert blob to base64
          const arrayBuffer = await pdfData.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

          emailPayload.attachments = [{
            filename: `Rechnung-${order.invoice_number || order.order_number}.pdf`,
            content: base64,
            content_type: 'application/pdf',
          }];

          console.log('PDF attachment added to email');
        } else {
          console.warn('Could not download PDF for attachment:', downloadError);
        }
      } catch (attachmentError) {
        console.warn('Error adding PDF attachment:', attachmentError);
        // Continue sending email without attachment
      }
    }

    // Send email
    console.log('Sending email to:', order.customer_email);
    const emailResponse = await resend.emails.send(emailPayload);

    if (emailResponse.error) {
      console.error('Error sending email:', emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    console.log('Email sent successfully:', emailResponse);

    // Update order status to invoice_sent if this is an instant confirmation with invoice
    if (email_type === 'instant_confirmation' && include_invoice) {
      console.log('Updating order status to invoice_sent');
      const { error: statusUpdateError } = await supabase
        .from('orders')
        .update({ 
          status: 'invoice_sent',
          invoice_sent: true 
        })
        .eq('id', order_id);

      if (statusUpdateError) {
        console.error('Error updating order status:', statusUpdateError);
        // Don't fail the entire request for status update error
      } else {
        console.log('Order status updated to invoice_sent');
      }
    }

    return new Response(JSON.stringify({
      success: true,
      email_id: emailResponse.data?.id,
      email_type,
      sent_to: order.customer_email,
      attachment_included: !!emailPayload.attachments,
      status_updated: email_type === 'instant_confirmation' && include_invoice,
      sent_at: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error in send-order-confirmation function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
