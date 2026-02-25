import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SmsRequest {
  to: string;
  text: string;
  from: string;
}

function formatPhoneNumber(phone: string): string {
  // Remove spaces, hyphens, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // Replace leading 00 with +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }
  // Replace leading 0 with +49
  else if (cleaned.startsWith('0')) {
    cleaned = '+49' + cleaned.slice(1);
  }
  // If no + prefix, prepend +49
  else if (!cleaned.startsWith('+')) {
    cleaned = '+49' + cleaned;
  }
  return cleaned;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("SEVEN_API_KEY");
    if (!apiKey) {
      console.error("SEVEN_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "SMS service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { to, text, from }: SmsRequest = await req.json();

    if (!to || !text) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, text" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formattedTo = formatPhoneNumber(to);
    console.log(`Sending SMS to ${formattedTo} (original: ${to}) from "${from}", length: ${text.length} chars`);

    const response = await fetch("https://gateway.seven.io/api/sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({
        to: formattedTo,
        text,
        from: from || "Heizoel",
      }),
    });

    const responseText = await response.text();
    console.log("seven.io response:", response.status, responseText);

    if (!response.ok) {
      console.error("seven.io API error:", response.status, responseText);
      return new Response(
        JSON.stringify({ error: "SMS sending failed", details: responseText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, response: responseText }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-sms function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
