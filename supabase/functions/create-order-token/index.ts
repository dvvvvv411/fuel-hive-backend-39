
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
    // Only allow POST requests
    if (req.method !== 'POST') {
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

    // Parse request body
    const body = await req.json();
    const { shop_id, product, liters, price_per_liter, delivery_fee, total_amount } = body;

    // Validate required fields
    if (!shop_id || !product || !liters || !price_per_liter || delivery_fee === undefined || !total_amount) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: shop_id, product, liters, price_per_liter, delivery_fee, total_amount' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate shop exists
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, vat_rate')
      .eq('id', shop_id)
      .eq('active', true)
      .single();

    if (shopError || !shop) {
      console.error('Shop validation error:', shopError);
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive shop' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate unique token with prefix
    const tokenSuffix = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    const token = `tok_${tokenSuffix}`;

    // Calculate VAT amount if VAT rate is available
    const vatRate = shop.vat_rate || 0;
    const vatAmount = vatRate > 0 ? (total_amount * vatRate) / (100 + vatRate) : 0;

    // Set expiration time (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Insert token into database
    const { data: tokenData, error: insertError } = await supabase
      .from('order_tokens')
      .insert({
        token,
        shop_id,
        product,
        liters: parseFloat(liters),
        price_per_liter: parseFloat(price_per_liter),
        delivery_fee: parseFloat(delivery_fee),
        total_amount: parseFloat(total_amount),
        vat_rate: vatRate,
        vat_amount: vatAmount,
        expires_at: expiresAt.toISOString()
      })
      .select('token')
      .single();

    if (insertError) {
      console.error('Token insertion error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order token' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Order token created: ${token} for shop: ${shop_id}`);

    // Return the token
    return new Response(
      JSON.stringify({ token: tokenData.token }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
