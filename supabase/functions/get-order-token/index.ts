
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract token from URL parameters
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Looking up token: ${token}`);

    // Retrieve token data from database
    const { data: tokenData, error: tokenError } = await supabase
      .from('order_tokens')
      .select(`
        *,
        shops!inner(
          id,
          name,
          company_name,
          company_address,
          company_postcode,
          company_city,
          company_phone,
          company_email,
          vat_rate,
          currency
        )
      `)
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      console.error('Token lookup error:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Token not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if token is still valid (not expired)
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    
    if (now > expiresAt) {
      console.log(`Token expired: ${token}, expired at: ${expiresAt}`);
      return new Response(
        JSON.stringify({ error: 'Token has expired' }),
        { 
          status: 410, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Token found and valid: ${token}`);

    // Return the token data
    const response = {
      token: tokenData.token,
      shop_id: tokenData.shop_id,
      product: tokenData.product,
      liters: tokenData.liters,
      price_per_liter: tokenData.price_per_liter,
      delivery_fee: tokenData.delivery_fee,
      total_amount: tokenData.total_amount,
      vat_rate: tokenData.vat_rate,
      vat_amount: tokenData.vat_amount,
      expires_at: tokenData.expires_at,
      shop: tokenData.shops
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in get-order-token:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
