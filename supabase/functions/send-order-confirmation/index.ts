
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
    console.log('Sending confirmation email for order:', order_id, 'Type:', email_type);

    // Get order with shop and resend config
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        shops (
          name,
          company_name,
          company_email,
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

    // Prepare email content based on type
    let subject: string;
    let htmlContent: string;

    if (email_type === 'instant_confirmation') {
      subject = `Bestellbestätigung ${order.order_number} - Ihre Heizöl-Bestellung`;
      htmlContent = `
        <h1>Vielen Dank für Ihre Bestellung!</h1>
        <p>Ihre Heizöl-Bestellung wurde erfolgreich aufgegeben und wird automatisch bearbeitet.</p>
        
        <h2>Bestelldetails:</h2>
        <ul>
          <li><strong>Bestellnummer:</strong> ${order.order_number}</li>
          <li><strong>Produkt:</strong> ${order.product}</li>
          <li><strong>Menge:</strong> ${order.liters} Liter</li>
          <li><strong>Gesamtbetrag:</strong> €${order.total_amount.toFixed(2)}</li>
        </ul>
        
        <h2>Lieferadresse:</h2>
        <p>
          ${order.delivery_first_name} ${order.delivery_last_name}<br>
          ${order.delivery_street}<br>
          ${order.delivery_postcode} ${order.delivery_city}
        </p>
        
        <p><strong>Status:</strong> Ihre Bestellung wird automatisch bearbeitet. Sie erhalten in Kürze Ihre Rechnung per E-Mail.</p>
        
        <p>Bei Fragen kontaktieren Sie uns gerne unter ${order.shops?.company_email}</p>
        
        <p>Mit freundlichen Grüßen<br>
        ${order.shops?.company_name || order.shops?.name}</p>
      `;
    } else {
      subject = `Bestelleingang ${order.order_number} - Ihre Heizöl-Bestellung`;
      htmlContent = `
        <h1>Vielen Dank für Ihre Bestellung!</h1>
        <p>Wir haben Ihre Heizöl-Bestellung erhalten und werden sie schnellstmöglich bearbeiten.</p>
        
        <h2>Bestelldetails:</h2>
        <ul>
          <li><strong>Bestellnummer:</strong> ${order.order_number}</li>
          <li><strong>Produkt:</strong> ${order.product}</li>
          <li><strong>Menge:</strong> ${order.liters} Liter</li>
          <li><strong>Gesamtbetrag:</strong> €${order.total_amount.toFixed(2)}</li>
        </ul>
        
        <h2>Lieferadresse:</h2>
        <p>
          ${order.delivery_first_name} ${order.delivery_last_name}<br>
          ${order.delivery_street}<br>
          ${order.delivery_postcode} ${order.delivery_city}
        </p>
        
        <p><strong>Status:</strong> Ihre Bestellung wird manuell geprüft. Sie erhalten eine Bestätigung und Rechnung, sobald Ihre Bestellung bearbeitet wurde.</p>
        
        <p>Bei Fragen kontaktieren Sie uns gerne unter ${order.shops?.company_email}</p>
        
        <p>Mit freundlichen Grüßen<br>
        ${order.shops?.company_name || order.shops?.name}</p>
      `;
    }

    // Send email
    const emailResponse = await resend.emails.send({
      from: `${resendConfig.from_name} <${resendConfig.from_email}>`,
      to: [order.customer_email],
      subject: subject,
      html: htmlContent,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({
      success: true,
      email_id: emailResponse.data?.id,
      email_type,
      sent_to: order.customer_email,
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
