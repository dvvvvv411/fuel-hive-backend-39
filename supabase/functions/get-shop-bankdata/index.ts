
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
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
    // Parse request body to get shop_id
    const body = await req.json();
    const shopId = body.shop_id;

    console.log('Request body:', body);
    console.log('Extracted shop_id:', shopId);

    if (!shopId) {
      console.error('Shop ID not provided in request body');
      return new Response(JSON.stringify({ error: 'Shop ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Validate UUID format
    if (!isValidUUID(shopId)) {
      console.error('Invalid shop ID format:', shopId);
      return new Response(JSON.stringify({ error: 'Invalid shop ID format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Getting bank data for shop:', shopId);

    // First, get the shop and check if it's active
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, name, company_name, active, bank_account_id')
      .eq('id', shopId)
      .eq('active', true)
      .single();

    if (shopError) {
      console.error('Shop query error:', shopError);
      return new Response(JSON.stringify({ error: 'Shop not found or inactive' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!shop) {
      console.error('Shop not found or inactive:', shopId);
      return new Response(JSON.stringify({ error: 'Shop not found or inactive' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Found shop:', shop.name, 'Bank account ID:', shop.bank_account_id);

    if (!shop.bank_account_id) {
      console.error('No bank account configured for shop:', shopId);
      return new Response(JSON.stringify({ error: 'No bank account configured for this shop' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Now get the bank account details
    const { data: bankAccount, error: bankError } = await supabase
      .from('bank_accounts')
      .select('account_name, account_holder, bank_name, iban, bic, currency, active')
      .eq('id', shop.bank_account_id)
      .eq('active', true)
      .single();

    if (bankError) {
      console.error('Bank account query error:', bankError);
      return new Response(JSON.stringify({ error: 'Bank account not found or inactive' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!bankAccount) {
      console.error('Bank account not found or inactive for shop:', shopId);
      return new Response(JSON.stringify({ error: 'Bank account not found or inactive' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Bank data retrieved successfully for shop:', shopId);

    return new Response(JSON.stringify({
      shop_name: shop.company_name,
      bank_data: {
        account_name: bankAccount.account_name,
        account_holder: bankAccount.account_holder,
        bank_name: bankAccount.bank_name,
        iban: bankAccount.iban,
        bic: bankAccount.bic,
        currency: bankAccount.currency,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error in get-shop-bankdata function:', error);
    
    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError) {
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
