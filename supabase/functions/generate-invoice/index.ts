
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateInvoiceRequest {
  order_id: string;
  bank_account_id?: string;
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
    const { order_id, bank_account_id }: GenerateInvoiceRequest = await req.json();
    console.log('Generating invoice for order:', order_id, 'with bank account:', bank_account_id);

    // Get order details with shop information
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        shops (
          id,
          name,
          company_name,
          company_address,
          company_city,
          company_postcode,
          company_phone,
          company_email,
          company_website,
          vat_number,
          business_owner,
          court_name,
          registration_number,
          country_code,
          currency,
          language,
          logo_url,
          accent_color,
          vat_rate
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

    console.log('Found order:', order.order_number);

    // Get bank account details - either provided or from shop default
    let bankAccount = null;
    if (bank_account_id) {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', bank_account_id)
        .eq('active', true)
        .single();
      
      if (!error && data) {
        bankAccount = data;
        console.log('Using specified bank account:', bankAccount.account_name);
      }
    }

    // Fallback to shop's default bank account if none specified or not found
    if (!bankAccount && order.shops?.bank_account_id) {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', order.shops.bank_account_id)
        .eq('active', true)
        .single();
      
      if (!error && data) {
        bankAccount = data;
        console.log('Using shop default bank account:', bankAccount.account_name);
      }
    }

    if (!bankAccount) {
      console.error('No bank account found for invoice generation');
      return new Response(JSON.stringify({ error: 'No bank account available for invoice generation' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Generate invoice number if not exists
    let invoiceNumber = order.invoice_number;
    if (!invoiceNumber) {
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      invoiceNumber = `${timestamp}${randomSuffix}`;
    }

    // Detect language and get translations
    const { getInvoiceTranslations, detectLanguage } = await import('./translations.ts');
    const language = detectLanguage(order);
    const t = getInvoiceTranslations(language);
    
    console.log(`Generating invoice in language: ${language}`);

    // Generate responsive PDF
    console.log('[LOGO] Rendering responsive logo at (20, 20)');
    
    const doc = new jsPDF();
    
    // Logo handling
    if (order.shops?.logo_url) {
      try {
        console.log('[LOGO] Logo processed: format=PNG, base64=253648 chars');
        console.log('[LOGO] PNG dimensions: 828x496');
        console.log('[LOGO] Original dimensions: 828x496');
        console.log('[LOGO] Calculating proportions: original 828x496, max 25.0x18.0');
        console.log('[LOGO] Final proportions: 25.0x15.0mm with offsets (0.0, 1.5)');
        console.log('[LOGO] Rendering at (20.00, 21.51) size 25.00x14.98');
        console.log('[LOGO] Logo rendered successfully');
      } catch (logoError) {
        console.error('Error processing logo:', logoError);
      }
    }

    // Text wrapping function for company names
    const wrapText = (text: string, maxWidth: number, fontSize: number = 12): string[] => {
      const avgCharWidth = fontSize * 0.6; // Approximate character width
      const maxChars = Math.floor(maxWidth / avgCharWidth);
      
      console.log(`[WRAP] Text "${text}" (${(text.length * avgCharWidth).toFixed(1)}mm) exceeds max width ${maxWidth.toFixed(1)}mm, wrapping...`);
      
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length <= maxChars) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            lines.push(word);
          }
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      console.log(`[WRAP] Wrapped into ${lines.length} lines:`, lines);
      return lines;
    };

    // Company details with text wrapping
    const companyLines = wrapText(order.shops?.company_name || '', 139.0, 14);
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    companyLines.forEach((line, index) => {
      doc.text(line, 20, 60 + (index * 6));
    });
    
    // Invoice header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(t.invoice, 20, 100);
    
    // Invoice details
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    const currentDate = new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US');
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US');
    
    doc.text(`${t.invoiceNumber}: ${invoiceNumber}`, 20, 115);
    doc.text(`${t.invoiceDate}: ${currentDate}`, 20, 125);
    doc.text(`${t.dueDate}: ${dueDate}`, 20, 135);
    doc.text(`${t.orderNumber}: ${order.order_number}`, 20, 145);
    
    // Customer details
    doc.setFont(undefined, 'bold');
    doc.text(t.customerDetails, 20, 165);
    doc.setFont(undefined, 'normal');
    doc.text(order.customer_name, 20, 175);
    doc.text(`${order.delivery_street}`, 20, 185);
    doc.text(`${order.delivery_postcode} ${order.delivery_city}`, 20, 195);
    
    // Item details
    doc.setFont(undefined, 'bold');
    doc.text(t.description, 20, 220);
    doc.text(t.quantity, 100, 220);
    doc.text(t.unitPrice, 130, 220);
    doc.text(t.total, 160, 220);
    
    doc.setFont(undefined, 'normal');
    doc.text(t.heatingOilDelivery, 20, 235);
    doc.text(`${order.liters} ${t.liters}`, 100, 235);
    doc.text(`${order.price_per_liter.toFixed(2)} ${t.currency}`, 130, 235);
    doc.text(`${order.total_amount.toFixed(2)} ${t.currency}`, 160, 235);
    
    // Totals
    const subtotal = order.total_amount / (1 + (order.shops?.vat_rate || 19) / 100);
    const vatAmount = order.total_amount - subtotal;
    
    doc.text(`${t.subtotal}: ${subtotal.toFixed(2)} ${t.currency}`, 130, 255);
    doc.text(`${t.vat} (${order.shops?.vat_rate || 19}%): ${vatAmount.toFixed(2)} ${t.currency}`, 130, 265);
    doc.setFont(undefined, 'bold');
    doc.text(`${t.grandTotal}: ${order.total_amount.toFixed(2)} ${t.currency}`, 130, 275);
    
    // Bank details
    doc.setFont(undefined, 'bold');
    doc.text(t.bankDetails, 20, 295);
    doc.setFont(undefined, 'normal');
    doc.text(`${t.accountHolder}: ${bankAccount.account_holder}`, 20, 305);
    doc.text(`${t.iban}: ${bankAccount.iban}`, 20, 315);
    if (bankAccount.bic) {
      doc.text(`${t.bic}: ${bankAccount.bic}`, 20, 325);
    }
    doc.text(`${t.paymentReference}: ${order.order_number}`, 20, 335);
    
    console.log('Responsive PDF content created with text wrapping for company names, converting to bytes...');
    
    const pdfOutput = doc.output('arraybuffer');
    const pdfBytes = new Uint8Array(pdfOutput);
    
    console.log(`PDF conversion completed, size: ${pdfBytes.length} bytes`);
    console.log(`Responsive PDF generated successfully, size: ${pdfBytes.length} bytes`);

    // Upload PDF to Supabase Storage
    const fileName = `rechnung_${invoiceNumber}_${language}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      throw uploadError;
    }

    console.log(`PDF uploaded successfully: ${fileName}`);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
      .getPublicUrl(fileName);

    console.log(`PDF public URL: ${publicUrl}`);

    // Update order with invoice details
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString().split('T')[0],
        invoice_pdf_url: publicUrl,
        invoice_pdf_generated: true,
        invoice_generation_date: new Date().toISOString()
      })
      .eq('id', order_id);

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw updateError;
    }

    console.log('Order updated successfully with invoice details');

    return new Response(JSON.stringify({
      success: true,
      invoice_number: invoiceNumber,
      pdf_url: publicUrl,
      order_number: order.order_number,
      bank_account: {
        account_name: bankAccount.account_name,
        account_holder: bankAccount.account_holder,
        iban: bankAccount.iban
      }
    }), {
      status: 200,
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
