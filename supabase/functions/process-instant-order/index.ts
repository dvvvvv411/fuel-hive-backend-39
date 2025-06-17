
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessOrderRequest {
  order_id: string;
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
    const { order_id }: ProcessOrderRequest = await req.json();
    console.log('Processing instant order:', order_id);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        shops (
          id,
          name,
          company_name,
          company_address,
          company_postcode,
          company_city,
          company_email,
          company_phone,
          vat_number,
          registration_number,
          resend_config_id,
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

    console.log('Found order:', order.order_number);

    // Step 1: Generate invoice PDF
    console.log('Generating invoice for instant order...');
    const invoiceResponse = await supabase.functions.invoke('generate-invoice', {
      body: { order_id: order_id }
    });

    if (invoiceResponse.error) {
      console.error('Error generating invoice:', invoiceResponse.error);
      throw new Error('Failed to generate invoice');
    }

    console.log('Invoice generated successfully');

    // Step 2: Send confirmation email with invoice
    if (order.shops?.resend_configs?.resend_api_key) {
      console.log('Sending confirmation email with invoice...');
      
      const emailResponse = await supabase.functions.invoke('send-order-confirmation', {
        body: { 
          order_id: order_id,
          include_invoice: true,
          email_type: 'instant_confirmation'
        }
      });

      if (emailResponse.error) {
        console.error('Error sending email:', emailResponse.error);
        // Don't fail the whole process if email fails
      } else {
        console.log('Confirmation email sent successfully');
      }
    } else {
      console.log('No email configuration found for shop, skipping email');
    }

    // Update order status to indicate processing is complete
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'invoice_sent',
        invoice_sent: true
      })
      .eq('id', order_id);

    if (updateError) {
      console.error('Error updating order status:', updateError);
    }

    console.log('Instant order processing completed for:', order.order_number);

    return new Response(JSON.stringify({
      success: true,
      order_number: order.order_number,
      invoice_generated: true,
      email_sent: !!order.shops?.resend_configs?.resend_api_key,
      processed_at: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error in process-instant-order function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
