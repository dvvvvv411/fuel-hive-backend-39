
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

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

    // Get order with shop and bank account information
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        shops (
          name,
          company_name,
          company_address,
          company_postcode,
          company_city,
          company_email,
          company_phone,
          vat_number,
          registration_number,
          bank_account_id
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

    // Get bank account details if available
    let bankAccount = null;
    if (order.shops.bank_account_id) {
      const { data: bankData, error: bankError } = await supabase
        .from('bank_accounts')
        .select('account_holder, use_anyname')
        .eq('id', order.shops.bank_account_id)
        .single();

      if (!bankError && bankData) {
        bankAccount = bankData;
      }
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

    console.log('Creating PDF for invoice:', invoiceNumber);

    // Create PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Company header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(order.shops.company_name || 'Company Name', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(order.shops.company_address || '', 20, yPosition);
    yPosition += 5;
    doc.text(`${order.shops.company_postcode || ''} ${order.shops.company_city || ''}`, 20, yPosition);
    yPosition += 5;
    if (order.shops.company_phone) {
      doc.text(`Tel: ${order.shops.company_phone}`, 20, yPosition);
      yPosition += 5;
    }
    doc.text(`Email: ${order.shops.company_email || ''}`, 20, yPosition);
    yPosition += 15;

    // Invoice title and number
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RECHNUNG', pageWidth - 60, 30);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nr: ${invoiceNumber}`, pageWidth - 60, 40);
    doc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, pageWidth - 60, 50);

    // Customer information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Rechnungsempfänger:', 20, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.text(order.customer_name, 20, yPosition);
    yPosition += 5;
    
    // Use billing address if different, otherwise delivery address
    const customerAddress = order.use_same_address 
      ? `${order.delivery_street}\n${order.delivery_postcode} ${order.delivery_city}`
      : `${order.billing_street || order.delivery_street}\n${order.billing_postcode || order.delivery_postcode} ${order.billing_city || order.delivery_city}`;
    
    const addressLines = customerAddress.split('\n');
    addressLines.forEach(line => {
      doc.text(line, 20, yPosition);
      yPosition += 5;
    });

    yPosition += 15;

    // Table header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Pos.', 20, yPosition);
    doc.text('Beschreibung', 40, yPosition);
    doc.text('Menge', 120, yPosition);
    doc.text('Preis', 140, yPosition);
    doc.text('Gesamt', 170, yPosition);
    yPosition += 5;

    // Table line
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    // Table content
    doc.setFont('helvetica', 'normal');
    
    // Main product line
    doc.text('1', 20, yPosition);
    doc.text(`${order.product} - ${order.liters}L`, 40, yPosition);
    doc.text(`${order.liters}`, 120, yPosition);
    doc.text(`€${order.price_per_liter.toFixed(2)}`, 140, yPosition);
    doc.text(`€${order.base_price.toFixed(2)}`, 170, yPosition);
    yPosition += 8;

    // Delivery fee line
    doc.text('2', 20, yPosition);
    doc.text('Liefergebühr', 40, yPosition);
    doc.text('1', 120, yPosition);
    doc.text(`€${order.delivery_fee.toFixed(2)}`, 140, yPosition);
    doc.text(`€${order.delivery_fee.toFixed(2)}`, 170, yPosition);
    yPosition += 15;

    // Total line
    doc.line(140, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Gesamtbetrag:', 140, yPosition);
    doc.text(`€${order.total_amount.toFixed(2)}`, 170, yPosition);
    yPosition += 20;

    // Delivery address
    doc.setFont('helvetica', 'bold');
    doc.text('Lieferadresse:', 20, yPosition);
    yPosition += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(`${order.delivery_first_name} ${order.delivery_last_name}`, 20, yPosition);
    yPosition += 5;
    doc.text(order.delivery_street, 20, yPosition);
    yPosition += 5;
    doc.text(`${order.delivery_postcode} ${order.delivery_city}`, 20, yPosition);
    yPosition += 15;

    // Payment recipient information
    if (bankAccount) {
      doc.setFont('helvetica', 'bold');
      doc.text('Zahlungsempfänger:', 20, yPosition);
      yPosition += 8;
      doc.setFont('helvetica', 'normal');
      
      // Use shop name if use_anyname is enabled, otherwise use account holder
      const paymentRecipient = bankAccount.use_anyname ? order.shops.name : bankAccount.account_holder;
      doc.text(paymentRecipient, 20, yPosition);
      yPosition += 10;
    }

    // Footer with company details
    if (order.shops.vat_number || order.shops.registration_number) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      yPosition = doc.internal.pageSize.height - 30;
      
      if (order.shops.vat_number) {
        doc.text(`USt-IdNr: ${order.shops.vat_number}`, 20, yPosition);
        yPosition += 4;
      }
      if (order.shops.registration_number) {
        doc.text(`Handelsregister: ${order.shops.registration_number}`, 20, yPosition);
      }
    }

    console.log('PDF created successfully, preparing upload');

    // Generate PDF as base64
    const pdfBase64 = doc.output('dataurlstring').split(',')[1];
    const pdfBuffer = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));

    // Upload to Supabase Storage
    const fileName = `${invoiceNumber}-${order_id}.pdf`;
    console.log('Uploading PDF to storage:', fileName);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      return new Response(JSON.stringify({ error: 'Failed to upload PDF', details: uploadError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('PDF uploaded successfully:', uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('invoices')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;
    console.log('Public URL generated:', publicUrl);

    // Update order with invoice information - DO NOT change status here
    // Let the frontend handle status updates through the email sending flow
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString().split('T')[0],
        invoice_pdf_generated: true,
        invoice_pdf_url: publicUrl,
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
      invoice_url: publicUrl,
      generated_at: new Date().toISOString(),
      file_name: fileName,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error in generate-invoice function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
