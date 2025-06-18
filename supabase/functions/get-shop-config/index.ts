
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
    const shopId = url.pathname.split('/')[3]; // Extract shop_id from /shop/{shop_id}/config

    if (!shopId) {
      return new Response(JSON.stringify({ error: 'Shop ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Getting shop configuration for shop:', shopId);

    // Get shop configuration with related data
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select(`
        id,
        name,
        company_name,
        company_email,
        company_phone,
        company_website,
        company_address,
        company_city,
        company_postcode,
        country_code,
        currency,
        language,
        active,
        checkout_mode,
        vat_rate,
        logo_url,
        accent_color,
        support_phone,
        vat_number,
        business_owner,
        court_name,
        registration_number
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

    // Get available payment methods for the shop
    const { data: paymentMethods, error: paymentError } = await supabase
      .from('shop_payment_methods')
      .select(`
        payment_method_id,
        active,
        payment_methods (
          id,
          name,
          code,
          description,
          active
        )
      `)
      .eq('shop_id', shopId)
      .eq('active', true);

    if (paymentError) {
      console.error('Error fetching payment methods:', paymentError);
    }

    const activePaymentMethods = paymentMethods?.filter(spm => 
      spm.payment_methods && spm.payment_methods.active
    ).map(spm => spm.payment_methods) || [];

    console.log('Shop configuration retrieved successfully for shop:', shopId);

    return new Response(JSON.stringify({
      shop: {
        id: shop.id,
        name: shop.name,
        company_name: shop.company_name,
        company_email: shop.company_email,
        company_phone: shop.company_phone,
        company_website: shop.company_website,
        company_address: shop.company_address,
        company_city: shop.company_city,
        company_postcode: shop.company_postcode,
        country_code: shop.country_code,
        currency: shop.currency,
        language: shop.language,
        checkout_mode: shop.checkout_mode,
        vat_rate: shop.vat_rate,
        logo_url: shop.logo_url,
        accent_color: shop.accent_color,
        support_phone: shop.support_phone,
        vat_number: shop.vat_number,
        business_owner: shop.business_owner,
        court_name: shop.court_name,
        registration_number: shop.registration_number,
      },
      payment_methods: activePaymentMethods,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error in get-shop-config function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
