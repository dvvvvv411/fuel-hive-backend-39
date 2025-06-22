
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessOrderRequest {
  order_id: string;
  temp_order_number?: string;
  bank_account_id?: string;
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
    const { order_id, temp_order_number, bank_account_id }: ProcessOrderRequest = await req.json();
    console.log('Processing manual order:', order_id, 'with temp order number:', temp_order_number, 'and bank account:', bank_account_id);

    // Update the order with temporary order number and selected bank account if provided
    const updateData: any = {};
    
    if (temp_order_number) {
      updateData.temp_order_number = temp_order_number;
    }
    
    if (bank_account_id) {
      updateData.selected_bank_account_id = bank_account_id;
      console.log('Setting selected_bank_account_id to:', bank_account_id);
    }

    if (Object.keys(updateData).length > 0) {
      console.log('Updating order with data:', updateData);
      
      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', order_id);

      if (updateError) {
        console.error('Error updating order:', updateError);
        // Don't fail the process, just log the error
      } else {
        console.log('Updated order successfully with:', updateData);
      }
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        shops (
          id,
          name,
          company_name,
          company_email,
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

    console.log('Found manual order:', order.order_number);

    // Send confirmation email (without invoice)
    if (order.shops?.resend_configs?.resend_api_key) {
      console.log('Sending confirmation email for manual order...');
      
      const emailResponse = await supabase.functions.invoke('send-order-confirmation', {
        body: { 
          order_id: order_id,
          include_invoice: false,
          email_type: 'manual_confirmation'
        }
      });

      if (emailResponse.error) {
        console.error('Error sending confirmation email:', emailResponse.error);
        // Don't fail the whole process if email fails
      } else {
        console.log('Confirmation email sent successfully');
      }
    } else {
      console.log('No email configuration found for shop, skipping email');
    }

    console.log('Manual order processing completed for:', order.order_number);

    return new Response(JSON.stringify({
      success: true,
      order_number: order.order_number,
      temp_order_number: temp_order_number || order.order_number,
      processing_mode: 'manual',
      email_sent: !!order.shops?.resend_configs?.resend_api_key,
      processed_at: new Date().toISOString(),
      message: 'Order received and confirmation sent. Manual processing required.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error in process-manual-order function:', error);
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
