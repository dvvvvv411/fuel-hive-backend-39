
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function formatPhone(phone: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return '+49' + digits.slice(1);
  }
  if (digits.startsWith('49')) {
    return '+' + digits;
  }
  return '+' + digits;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(amount);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY is not configured');
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), { status: 500, headers: corsHeaders });
  }

  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
  if (!TELEGRAM_API_KEY) {
    console.error('TELEGRAM_API_KEY is not configured');
    return new Response(JSON.stringify({ error: 'TELEGRAM_API_KEY not configured' }), { status: 500, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const body = await req.json();

    // Test message mode
    if (body.test && body.test_chat_id) {
      const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': TELEGRAM_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: body.test_chat_id,
          text: '✅ Telegram-Benachrichtigungen sind aktiv!',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Telegram API failed [${response.status}]: ${JSON.stringify(data)}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normal notification mode
    const { order_id } = body;
    if (!order_id) {
      return new Response(JSON.stringify({ error: 'order_id required' }), { status: 400, headers: corsHeaders });
    }

    // Load order with shop
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, shops!inner(name)')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: corsHeaders });
    }

    // Load active chat IDs with their shop assignments
    const { data: chatIds, error: chatError } = await supabase
      .from('telegram_chat_ids')
      .select('id, chat_id')
      .eq('active', true);

    if (chatError || !chatIds || chatIds.length === 0) {
      console.log('No active chat IDs found');
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For each chat ID, check shop assignment
    const targetChatIds: string[] = [];
    for (const chat of chatIds) {
      const { data: shopAssignments } = await supabase
        .from('telegram_chat_id_shops')
        .select('shop_id')
        .eq('telegram_chat_id_id', chat.id);

      if (!shopAssignments || shopAssignments.length === 0) {
        // No shops assigned = receive all
        targetChatIds.push(chat.chat_id);
      } else if (shopAssignments.some(s => s.shop_id === order.shop_id)) {
        targetChatIds.push(chat.chat_id);
      }
    }

    if (targetChatIds.length === 0) {
      console.log('No matching chat IDs for shop:', order.shop_id);
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Format message
    const phone = formatPhone(order.customer_phone || order.delivery_phone);
    const productLabel = (order.product || '').toLowerCase().includes('premium')
      ? 'Premium Heizöl'
      : 'Standard Heizöl';
    const shopName = (order as any).shops?.name || 'Unbekannt';

    const message = `🛢 <b>Neue Bestellung #${order.order_number}</b>

👤 Name: ${order.customer_name}
📞 Tel: ${phone}
📍 PLZ/Ort: ${order.delivery_postcode} ${order.delivery_city}
🛢 Produkt: ${productLabel}
📦 Menge: ${Number(order.liters).toLocaleString('de-DE')} Liter
💰 Preis: ${formatCurrency(Number(order.total_amount), order.currency)}
💳 Zahlung: ${order.payment_method}
🏪 Shop: ${shopName}`;

    const replyMarkup = phone ? {
      inline_keyboard: [[{
        text: '📞 Nummer kopieren',
        copy_text: { text: phone },
      }]],
    } : undefined;

    // Send to all target chat IDs
    let sent = 0;
    for (const chatId of targetChatIds) {
      try {
        const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': TELEGRAM_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
            reply_markup: replyMarkup,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          console.error(`Failed to send to ${chatId}:`, data);
        } else {
          sent++;
        }
      } catch (err) {
        console.error(`Error sending to ${chatId}:`, err);
      }
    }

    console.log(`Telegram notifications sent: ${sent}/${targetChatIds.length}`);

    return new Response(JSON.stringify({ success: true, sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-telegram-notification:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
