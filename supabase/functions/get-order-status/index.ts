
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
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
    const url = new URL(req.url);
    const orderId = url.pathname.split('/')[3]; // Extract order_id from /api/order/{order_id}/status

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Order ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Getting status for order:', orderId);

    // Get order status with relevant information
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        created_at,
        total_amount,
        payment_method,
        processing_mode,
        invoice_number,
        invoice_pdf_generated,
        invoice_pdf_url,
        invoice_sent,
        bank_details_shown,
        shops (
          name,
          company_name,
          checkout_mode
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Determine next steps based on status and checkout mode
    let nextSteps = [];
    let canShowBankDetails = false;

    switch (order.status) {
      case 'pending':
        if (order.processing_mode === 'manual') {
          nextSteps.push('Bestellung wird manuell geprüft');
          nextSteps.push('Sie erhalten eine Bestätigung per E-Mail');
        } else {
          nextSteps.push('Bestellung wird automatisch verarbeitet');
        }
        break;
      
      case 'confirmed':
        if (order.payment_method === 'bank_transfer' && !order.bank_details_shown) {
          canShowBankDetails = true;
          nextSteps.push('Überweisen Sie den Betrag an die angegebenen Bankdaten');
        }
        if (!order.invoice_pdf_generated) {
          nextSteps.push('Rechnung wird erstellt');
        }
        break;
      
      case 'paid':
        nextSteps.push('Zahlung erhalten');
        nextSteps.push('Lieferung wird vorbereitet');
        break;
      
      case 'delivered':
        nextSteps.push('Bestellung abgeschlossen');
        break;
      
      case 'cancelled':
        nextSteps.push('Bestellung storniert');
        break;
    }

    console.log('Order status retrieved successfully:', orderId);

    return new Response(JSON.stringify({
      order_id: order.id,
      order_number: order.order_number,
      status: order.status,
      created_at: order.created_at,
      total_amount: order.total_amount,
      payment_method: order.payment_method,
      processing_mode: order.processing_mode,
      checkout_mode: order.shops?.[0]?.checkout_mode,
      invoice: {
        generated: order.invoice_pdf_generated,
        number: order.invoice_number,
        url: order.invoice_pdf_url,
        sent: order.invoice_sent,
      },
      next_steps: nextSteps,
      can_show_bank_details: canShowBankDetails,
      bank_details_shown: order.bank_details_shown,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error in get-order-status function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
