
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderRequest {
  shop_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  delivery_first_name: string;
  delivery_last_name: string;
  delivery_street: string;
  delivery_postcode: string;
  delivery_city: string;
  delivery_phone?: string;
  use_same_address: boolean;
  billing_first_name?: string;
  billing_last_name?: string;
  billing_street?: string;
  billing_postcode?: string;
  billing_city?: string;
  product: string;
  liters: number;
  price_per_liter: number;
  delivery_fee: number;
  payment_method: string;
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
    const orderData: OrderRequest = await req.json();
    console.log('Received order data:', orderData);

    // Validate shop exists and get checkout mode
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('checkout_mode, active, currency')
      .eq('id', orderData.shop_id)
      .eq('active', true)
      .single();

    if (shopError || !shop) {
      console.error('Shop not found or inactive:', shopError);
      return new Response(JSON.stringify({ error: 'Shop not found or inactive' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calculate totals
    const basePrice = orderData.liters * orderData.price_per_liter;
    const totalAmount = basePrice + orderData.delivery_fee;

    // Determine initial status based on checkout mode
    const initialStatus = shop.checkout_mode === 'instant' ? 'confirmed' : 'pending';

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        shop_id: orderData.shop_id,
        order_number: orderNumber,
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone,
        delivery_first_name: orderData.delivery_first_name,
        delivery_last_name: orderData.delivery_last_name,
        delivery_street: orderData.delivery_street,
        delivery_postcode: orderData.delivery_postcode,
        delivery_city: orderData.delivery_city,
        delivery_phone: orderData.delivery_phone,
        use_same_address: orderData.use_same_address,
        billing_first_name: orderData.billing_first_name,
        billing_last_name: orderData.billing_last_name,
        billing_street: orderData.billing_street,
        billing_postcode: orderData.billing_postcode,
        billing_city: orderData.billing_city,
        product: orderData.product,
        liters: orderData.liters,
        price_per_liter: orderData.price_per_liter,
        base_price: basePrice,
        delivery_fee: orderData.delivery_fee,
        total_amount: totalAmount,
        amount: totalAmount,
        payment_method: orderData.payment_method,
        status: initialStatus,
        processing_mode: shop.checkout_mode,
      }])
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return new Response(JSON.stringify({ error: 'Failed to create order' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Order created successfully:', order);

    return new Response(JSON.stringify({
      order_id: order.id,
      order_number: order.order_number,
      status: order.status,
      total_amount: order.total_amount,
      checkout_mode: shop.checkout_mode,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error in create-order function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
