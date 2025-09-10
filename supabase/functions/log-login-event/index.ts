import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LoginEventRequest {
  user_id?: string;
  email: string;
  event_type: 'sign_in' | 'sign_up' | 'sign_out';
  success: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: LoginEventRequest = await req.json();
    console.log('Logging login event:', body);

    // Get IP address from request headers
    const ip_address = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown';

    // Get user agent
    const user_agent = req.headers.get('user-agent') || 'unknown';

    // Insert login event
    const { error } = await supabase
      .from('login_events')
      .insert({
        user_id: body.user_id || null,
        email: body.email,
        event_type: body.event_type,
        ip_address: ip_address,
        user_agent: user_agent,
        success: body.success
      });

    if (error) {
      console.error('Error logging login event:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to log login event' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Login event logged successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in log-login-event function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});