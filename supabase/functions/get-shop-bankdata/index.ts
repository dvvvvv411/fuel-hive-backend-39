
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
    const shopId = url.pathname.split('/')[3]; // Extract shop_id from /api/shop/{shop_id}/bankdata

    if (!shopId) {
      return new Response(JSON.stringify({ error: 'Shop ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Getting bank data for shop:', shopId);

    // Get shop with bank account information
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select(`
        id,
        name,
        company_name,
        active,
        bank_account_id,
        bank_accounts (
          account_name,
          account_holder,
          bank_name,
          iban,
          bic,
          currency,
          active
        )
      `)
      .eq('id', shopId)
      .eq('active', true)
      .single();

    if (shopError || !shop) {
      console.error('Shop not found or inactive:', shopError);
      return new Response(JSON.stringify({ error: 'Shop not found or inactive' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!shop.bank_account_id || !shop.bank_accounts) {
      console.error('No bank account configured for shop:', shopId);
      return new Response(JSON.stringify({ error: 'No bank account configured for this shop' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const bankAccount = shop.bank_accounts;

    if (!bankAccount.active) {
      console.error('Bank account inactive for shop:', shopId);
      return new Response(JSON.stringify({ error: 'Bank account is inactive' }), {
        status: 400,
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
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
