
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DirectOrderRequest {
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

interface TokenOrderRequest {
  token: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  delivery_street: string;
  delivery_postal_code: string;
  delivery_city: string;
  billing_street?: string;
  billing_postal_code?: string;
  billing_city?: string;
  payment_method_id: string;
  terms_accepted: boolean;
}

// Function to generate a unique 7-digit order number
async function generateUniqueOrderNumber(supabase: any): Promise<string> {
  let orderNumber: string;
  let exists: boolean;
  
  do {
    // Generate a random 7-digit number (1000000 to 9999999)
    const randomNumber = Math.floor(Math.random() * 9000000) + 1000000;
    orderNumber = randomNumber.toString();
    
    // Check if this order number already exists
    const { data } = await supabase
      .from('orders')
      .select('order_number')
      .eq('order_number', orderNumber)
      .single();
    
    exists = !!data;
  } while (exists);
  
  return orderNumber;
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
    const requestData = await req.json();
    console.log('Received order data:', requestData);

    // Silent rate-limiting anti-spam system
    const customerEmail = requestData.customer_email?.toLowerCase()?.trim();
    
    if (customerEmail) {
      // Check if email is already in persistent blocklist
      const { data: blockedEmail } = await supabase
        .from('blocked_emails')
        .select('email')
        .eq('email', customerEmail)
        .single();

      if (blockedEmail) {
        console.log('Blocked persistent spam email:', customerEmail);
        return new Response(JSON.stringify({ 
          error: 'Bestellungen sind aktuell nicht möglich. Bitte versuchen Sie es später erneut.' 
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Rate limiting: Check for orders from this email in the last minute
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
      const { data: recentOrders, error: countError } = await supabase
        .from('orders')
        .select('id, created_at')
        .eq('customer_email', customerEmail)
        .gte('created_at', oneMinuteAgo)
        .order('created_at', { ascending: false });

      if (countError) {
        console.error('Error checking order count:', countError);
      } else if (recentOrders && recentOrders.length >= 3) {
        console.log(`Rate limit exceeded for ${customerEmail}: ${recentOrders.length} orders in last minute`);
        
        // Automatically add to blocklist
        const { error: blockError } = await supabase
          .from('blocked_emails')
          .insert({
            email: customerEmail,
            reason: 'rate_limit_exceeded',
            notes: `Auto-blocked: ${recentOrders.length} orders in 1 minute`
          });
        
        if (blockError) {
          console.error('Error adding email to blocklist:', blockError);
        } else {
          console.log('Email automatically added to blocklist:', customerEmail);
        }

        // Return same generic message - attacker won't know they're detected
        return new Response(JSON.stringify({ 
          error: 'Bestellungen sind aktuell nicht möglich. Bitte versuchen Sie es später erneut.' 
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Also block known spam emails (legacy support)
      const legacyBlockedEmails = ['telegram@realmrblxck.com'];
      if (legacyBlockedEmails.includes(customerEmail)) {
        console.log('Blocked legacy spam email:', customerEmail);
        return new Response(JSON.stringify({ 
          error: 'Bestellungen sind aktuell nicht möglich. Bitte versuchen Sie es später erneut.' 
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    let orderData: DirectOrderRequest;
    let tokenData: any = null;

    // Check if this is a token-based order
    if (requestData.token) {
      console.log('Processing token-based order with token:', requestData.token);
      
      // Retrieve token data from database
      const { data: retrievedTokenData, error: tokenError } = await supabase
        .from('order_tokens')
        .select(`
          *,
          shops!inner(
            id,
            name,
            company_name,
            checkout_mode,
            active,
            currency
          )
        `)
        .eq('token', requestData.token)
        .single();

      if (tokenError || !retrievedTokenData) {
        console.error('Token lookup error:', tokenError);
        return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Check if token is still valid
      const now = new Date();
      const expiresAt = new Date(retrievedTokenData.expires_at);
      
      if (now > expiresAt) {
        console.log(`Token expired: ${requestData.token}, expired at: ${expiresAt}`);
        return new Response(JSON.stringify({ error: 'Token has expired' }), {
          status: 410,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      tokenData = retrievedTokenData;

      // Split customer name into first and last name
      const nameParts = requestData.customer_name?.trim().split(' ') || ['', ''];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Check if billing address is provided and different from delivery address
      const hasBillingAddress = requestData.billing_street && 
                               requestData.billing_postal_code && 
                               requestData.billing_city;
      
      const isDifferentBillingAddress = hasBillingAddress && (
        requestData.billing_street !== requestData.delivery_street ||
        requestData.billing_postal_code !== requestData.delivery_postal_code ||
        requestData.billing_city !== requestData.delivery_city
      );

      // Split billing name if different address is used
      let billingFirstName = firstName;
      let billingLastName = lastName;
      
      if (isDifferentBillingAddress) {
        // For different billing addresses, we use the same customer name
        // In a real scenario, you might want to collect separate billing contact info
        billingFirstName = firstName;
        billingLastName = lastName;
      }

      // Map token-based request to direct order format
      orderData = {
        shop_id: tokenData.shop_id,
        customer_name: requestData.customer_name,
        customer_email: requestData.customer_email,
        customer_phone: requestData.customer_phone,
        delivery_first_name: firstName,
        delivery_last_name: lastName,
        delivery_street: requestData.delivery_street,
        delivery_postcode: requestData.delivery_postal_code,
        delivery_city: requestData.delivery_city,
        delivery_phone: requestData.customer_phone,
        use_same_address: !isDifferentBillingAddress,
        billing_first_name: isDifferentBillingAddress ? billingFirstName : undefined,
        billing_last_name: isDifferentBillingAddress ? billingLastName : undefined,
        billing_street: isDifferentBillingAddress ? requestData.billing_street : undefined,
        billing_postcode: isDifferentBillingAddress ? requestData.billing_postal_code : undefined,
        billing_city: isDifferentBillingAddress ? requestData.billing_city : undefined,
        product: tokenData.product,
        liters: tokenData.liters,
        price_per_liter: tokenData.price_per_liter,
        delivery_fee: tokenData.delivery_fee,
        payment_method: requestData.payment_method_id,
      };

      console.log('Mapped token order to direct order format:', orderData);
    } else {
      // Direct order data (existing functionality)
      orderData = requestData as DirectOrderRequest;
    }

    // Fixed exchange rates
    const getExchangeRate = (currency: string): number => {
      switch (currency.toUpperCase()) {
        case 'EUR':
          return 1.0;
        case 'PLN':
          return 0.233; // 1 PLN ≈ 0.233 EUR
        default:
          return 1.0; // Default to EUR rate
      }
    };

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

    // Generate simple 7-digit order number
    const orderNumber = await generateUniqueOrderNumber(supabase);

    // Calculate totals
    const basePrice = orderData.liters * orderData.price_per_liter;
    const totalAmount = basePrice + orderData.delivery_fee;

    // Get currency and calculate EUR equivalent
    const currency = shop.currency || 'EUR';
    const exchangeRate = getExchangeRate(currency);
    const eurAmount = totalAmount * exchangeRate;

    console.log(`Order currency: ${currency}, Amount: ${totalAmount}, Exchange rate: ${exchangeRate}, EUR amount: ${eurAmount}`);

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
        order_token: requestData.token || null,
        currency: currency,
        eur_amount: eurAmount,
        exchange_rate: exchangeRate,
      }])
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return new Response(JSON.stringify({ error: 'Failed to create order', details: orderError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Order created successfully:', order);

    // Process the order based on checkout mode (replacing the removed database trigger)
    try {
      if (shop.checkout_mode === 'instant') {
        console.log('Processing instant order...');
        const { error: processError } = await supabase.functions.invoke('process-instant-order', {
          body: { order_id: order.id }
        });
        
        if (processError) {
          console.error('Error processing instant order:', processError);
          // Don't fail the whole order creation if processing fails
        } else {
          console.log('Instant order processing initiated successfully');
        }
      } else {
        console.log('Processing manual order...');
        const { error: processError } = await supabase.functions.invoke('process-manual-order', {
          body: { order_id: order.id }
        });
        
        if (processError) {
          console.error('Error processing manual order:', processError);
          // Don't fail the whole order creation if processing fails
        } else {
          console.log('Manual order processing initiated successfully');
        }
      }
    } catch (processingError) {
      console.error('Order processing error:', processingError);
      // Continue with order creation success even if post-processing fails
    }

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
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
