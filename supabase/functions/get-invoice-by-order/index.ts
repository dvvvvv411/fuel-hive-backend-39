import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function isValidUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const body = await req.json();
    const { order_number, zip_code, branding_id } = body;

    // Validate input
    if (!order_number || !zip_code || !branding_id) {
      return new Response(JSON.stringify({ error: 'Bestellnummer, PLZ und BrandingID sind erforderlich' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (typeof order_number !== 'string' || order_number.length > 20) {
      return new Response(JSON.stringify({ error: 'Ungültige Bestellnummer' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (typeof zip_code !== 'string' || zip_code.length > 10) {
      return new Response(JSON.stringify({ error: 'Ungültige PLZ' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!isValidUUID(branding_id)) {
      return new Response(JSON.stringify({ error: 'Ungültige BrandingID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Looking up invoice for order:', order_number, 'zip:', zip_code, 'shop:', branding_id);

    // Query order with all three criteria
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, invoice_pdf_url, invoice_pdf_generated, total_amount, currency, selected_bank_account_id, delivery_postcode, billing_postcode')
      .eq('order_number', order_number)
      .eq('shop_id', branding_id)
      .single();

    if (orderError || !order) {
      console.log('Order not found or error:', orderError?.message);
      return new Response(JSON.stringify({ error: 'Bestellung nicht gefunden. Bitte überprüfen Sie Ihre Angaben.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Verify ZIP code matches delivery or billing
    const zipMatch = order.delivery_postcode === zip_code || 
                     (order.billing_postcode && order.billing_postcode === zip_code);

    if (!zipMatch) {
      console.log('ZIP code mismatch');
      return new Response(JSON.stringify({ error: 'Bestellung nicht gefunden. Bitte überprüfen Sie Ihre Angaben.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Check if invoice exists
    if (!order.invoice_pdf_generated || !order.invoice_pdf_url) {
      return new Response(JSON.stringify({ error: 'Für diese Bestellung wurde noch keine Rechnung erstellt.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get bank account data
    let bankData = null;
    if (order.selected_bank_account_id) {
      const { data: bankAccount } = await supabase
        .from('bank_accounts')
        .select('account_holder, iban, bic, bank_name')
        .eq('id', order.selected_bank_account_id)
        .single();

      if (bankAccount) {
        bankData = {
          account_holder: bankAccount.account_holder,
          iban: bankAccount.iban,
          bic: bankAccount.bic,
          bank_name: bankAccount.bank_name,
        };
      }
    }

    console.log('Invoice found for order:', order_number);

    return new Response(JSON.stringify({
      order_number: order.order_number,
      invoice_url: order.invoice_pdf_url,
      total_amount: order.total_amount,
      currency: order.currency,
      bank_data: bankData,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error in get-invoice-by-order:', error);

    if (error instanceof SyntaxError) {
      return new Response(JSON.stringify({ error: 'Ungültiger Request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: 'Interner Serverfehler' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
