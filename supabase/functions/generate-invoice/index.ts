import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvoiceRequest {
  order_id: string;
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
    const { order_id }: InvoiceRequest = await req.json();
    console.log('Generating invoice for order:', order_id);

    // Get order with shop information
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        shops (
          company_name,
          company_address,
          company_postcode,
          company_city,
          company_email,
          company_phone,
          vat_number,
          registration_number
        )
      `)
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Check if invoice already exists
    if (order.invoice_pdf_generated && order.invoice_pdf_url) {
      console.log('Invoice already exists for order:', order_id);
      return new Response(JSON.stringify({
        invoice_number: order.invoice_number,
        invoice_url: order.invoice_pdf_url,
        already_generated: true,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Generate invoice number if not exists
    let invoiceNumber = order.invoice_number;
    if (!invoiceNumber) {
      invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now()}`;
    }

    // Generate simple PDF content (in real implementation, use a PDF library)
    const invoiceData = {
      invoice_number: invoiceNumber,
      invoice_date: new Date().toISOString().split('T')[0],
      customer: {
        name: order.customer_name,
        email: order.customer_email,
        address: order.use_same_address 
          ? `${order.delivery_street}, ${order.delivery_postcode} ${order.delivery_city}`
          : `${order.billing_street || order.delivery_street}, ${order.billing_postcode || order.delivery_postcode} ${order.billing_city || order.delivery_city}`,
      },
      company: order.shops,
      items: [
        {
          description: `${order.product} - ${order.liters}L`,
          quantity: order.liters,
          unit_price: order.price_per_liter,
          total: order.base_price,
        },
        {
          description: 'Liefergebühr',
          quantity: 1,
          unit_price: order.delivery_fee,
          total: order.delivery_fee,
        },
      ],
      total_amount: order.total_amount,
    };

    // For now, we'll create a simple text representation
    // In a real implementation, you'd use a PDF generation library
    const pdfContent = `
      RECHNUNG ${invoiceNumber}
      Datum: ${invoiceData.invoice_date}
      
      Kunde: ${invoiceData.customer.name}
      Email: ${invoiceData.customer.email}
      Adresse: ${invoiceData.customer.address}
      
      Positionen:
      ${invoiceData.items.map(item => 
        `${item.description}: ${item.quantity} x ${item.unit_price}€ = ${item.total}€`
      ).join('\n')}
      
      Gesamtbetrag: ${invoiceData.total_amount}€
    `;

    // Simulate PDF URL (in real implementation, upload to storage)
    const simulatedPdfUrl = `https://example.com/invoices/${invoiceNumber}.pdf`;

    // Update order with invoice information
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        invoice_number: invoiceNumber,
        invoice_date: invoiceData.invoice_date,
        invoice_pdf_generated: true,
        invoice_pdf_url: simulatedPdfUrl,
        invoice_generation_date: new Date().toISOString(),
      })
      .eq('id', order_id);

    if (updateError) {
      console.error('Error updating order with invoice data:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update order with invoice data' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Invoice generated successfully for order:', order_id);

    return new Response(JSON.stringify({
      invoice_number: invoiceNumber,
      invoice_url: simulatedPdfUrl,
      invoice_data: invoiceData,
      generated_at: new Date().toISOString(),
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error in generate-invoice function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
