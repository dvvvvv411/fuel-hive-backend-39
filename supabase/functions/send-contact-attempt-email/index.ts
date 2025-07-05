import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactAttemptEmailRequest {
  orderId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId }: ContactAttemptEmailRequest = await req.json();

    // Get order with shop and resend config data
    const { data: order, error: orderError } = await supabase
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
          resend_configs!inner(
            resend_api_key,
            from_email,
            from_name
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shop = order.shops;
    const resendConfig = shop.resend_configs;

    if (!resendConfig?.resend_api_key) {
      return new Response(
        JSON.stringify({ error: 'No Resend configuration found for shop' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendConfig.resend_api_key);

    const shopName = shop.company_name || shop.name || 'Heizöl-Service';
    const shopPhone = shop.support_phone || shop.company_phone;
    const accentColor = shop.accent_color || '#2563eb';
    const displayOrderNumber = order.temp_order_number || order.order_number;
    const customerFirstName = order.delivery_first_name;
    const customerLastName = order.delivery_last_name;

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

    const emailResponse = await resend.emails.send({
      from: `${resendConfig.from_name} <${resendConfig.from_email}>`,
      to: [order.customer_email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Contact attempt email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true,
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-contact-attempt-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);