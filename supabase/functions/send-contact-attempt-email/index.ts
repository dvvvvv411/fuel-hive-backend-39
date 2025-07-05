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
          .contact-info {
            background-color: #dbeafe;
            border: 2px solid #3b82f6;
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
            text-align: center;
          }
          .phone-number {
            font-size: 28px;
            font-weight: 700;
            color: ${accentColor};
            margin: 15px 0;
            letter-spacing: 1px;
          }
          .call-to-action {
            background-color: #fef2f2;
            border: 2px solid #ef4444;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
          }
          .call-to-action h3 {
            color: #dc2626;
            margin: 0 0 10px 0;
            font-size: 18px;
          }
          .footer {
            text-align: center;
            padding: 20px;
            background-color: #f1f5f9;
            color: #64748b;
            font-size: 14px;
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
            
            <div class="call-to-action">
              <h3>🚨 Wichtiger Hinweis</h3>
              <p>Um Ihre Bestellung ordnungsgemäß abwickeln zu können, benötigen wir dringend Ihren Rückruf.</p>
            </div>
            
            <div class="contact-info">
              <h3 style="margin-top: 0; color: #1e293b; font-size: 20px;">📞 Bitte rufen Sie uns zurück</h3>
              <p style="font-size: 16px;"><strong>Ihr Ansprechpartner:</strong> ${shopName}</p>
              ${shopPhone ? `
                <div class="phone-number">
                  ${shopPhone}
                </div>
                <p style="margin-bottom: 0; font-size: 14px;"><small>Montag bis Freitag, 8:00 - 18:00 Uhr</small></p>
              ` : `
                <p style="color: #dc2626; font-weight: 500;">Bitte beachten Sie die Kontaktdaten in Ihrer Bestellbestätigung.</p>
              `}
            </div>
            
            <p><strong>Bestellnummer:</strong> #${displayOrderNumber}<br>
            <strong>Produkt:</strong> ${order.product}<br>
            <strong>Menge:</strong> ${order.liters} Liter</p>
            
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