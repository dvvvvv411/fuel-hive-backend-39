
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

    // Create PDF with professional styling matching InvoicePreview
    const doc = new jsPDF();
    const accentColor = order.shops?.accent_color || '#2563eb';
    
    // Convert hex color to RGB for jsPDF
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 37, g: 99, b: 235 }; // Default blue
    };
    
    const accentRgb = hexToRgb(accentColor);

    // Logo handling (if available)
    if (order.shops?.logo_url) {
      try {
        const logoResponse = await fetch(order.shops.logo_url);
        if (logoResponse.ok) {
          const logoBuffer = await logoResponse.arrayBuffer();
          const logoBase64 = btoa(String.fromCharCode(...new Uint8Array(logoBuffer)));
          
          // Calculate logo dimensions (max 40x30mm)
          const maxWidth = 40;
          const maxHeight = 30;
          
          doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', 20, 20, maxWidth, maxHeight);
          console.log('Logo added successfully');
        }
      } catch (logoError) {
        console.error('Error processing logo:', logoError);
      }
    }

    // Company details section
    doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(order.shops?.company_name || '', 70, 30);
    
    // Company address and details
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    let yPos = 40;
    
    doc.text(order.shops?.company_address || '', 70, yPos);
    yPos += 5;
    doc.text(`${order.shops?.company_postcode} ${order.shops?.company_city}`, 70, yPos);
    yPos += 5;
    
    if (order.shops?.company_phone) {
      doc.text(`${t.phone || 'Phone'}: ${order.shops.company_phone}`, 70, yPos);
      yPos += 5;
    }
    
    doc.text(`${t.email || 'Email'}: ${order.shops?.company_email}`, 70, yPos);
    yPos += 5;
    
    if (order.shops?.company_website) {
      doc.text(`${t.website || 'Website'}: ${order.shops.company_website}`, 70, yPos);
      yPos += 5;
    }
    
    if (order.shops?.vat_number) {
      doc.text(`USt-IdNr: ${order.shops.vat_number}`, 70, yPos);
    }

    // Invoice title
    doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text(t.invoice, 20, 80);

    // Customer address section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(t.customerDetails || 'Customer Details', 20, 100);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(order.customer_name, 20, 110);
    doc.text(order.delivery_street, 20, 118);
    doc.text(`${order.delivery_postcode} ${order.delivery_city}`, 20, 126);

    // Invoice details (right side)
    const currentDate = new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE');
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE');
    
    doc.setFontSize(10);
    doc.text(`${t.invoiceDate}: ${currentDate}`, 130, 110);
    doc.text(`${t.orderNumber}: ${order.order_number}`, 130, 118);
    doc.text(`${t.orderDate}: ${currentDate}`, 130, 126);

    // Items table header with accent color background
    const tableTop = 150;
    doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
    doc.rect(20, tableTop, 170, 10, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(t.description, 25, tableTop + 6);
    doc.text(t.quantity, 90, tableTop + 6);
    doc.text(t.unitPrice, 120, tableTop + 6);
    doc.text(t.total, 160, tableTop + 6);

    // Items table content
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.setFillColor(248, 248, 248);
    doc.rect(20, tableTop + 10, 170, 8, 'F');
    
    doc.text(t.heatingOilDelivery, 25, tableTop + 16);
    doc.text(`${order.liters} ${t.liters}`, 90, tableTop + 16);
    doc.text(`${t.currency}${order.price_per_liter.toFixed(3)}`, 120, tableTop + 16);
    doc.text(`${t.currency}${order.base_price.toFixed(2)}`, 160, tableTop + 16);

    // Delivery fee row (if applicable)
    let nextRowY = tableTop + 18;
    if (order.delivery_fee > 0) {
      doc.text(t.deliveryFee, 25, nextRowY + 8);
      doc.text('1', 90, nextRowY + 8);
      doc.text(`${t.currency}${order.delivery_fee.toFixed(2)}`, 120, nextRowY + 8);
      doc.text(`${t.currency}${order.delivery_fee.toFixed(2)}`, 160, nextRowY + 8);
      nextRowY += 10;
    }

    // Totals section
    const totalsY = nextRowY + 20;
    const vatRate = order.shops?.vat_rate || 19;
    const totalWithoutVat = order.total_amount / (1 + vatRate / 100);
    const vatAmount = order.total_amount - totalWithoutVat;

    // Totals box with background
    doc.setFillColor(248, 248, 248);
    doc.rect(130, totalsY, 60, 30, 'F');
    
    doc.setFontSize(10);
    doc.text(`${t.subtotal}: ${t.currency}${totalWithoutVat.toFixed(2)}`, 135, totalsY + 8);
    doc.text(`${t.vat} (${vatRate}%): ${t.currency}${vatAmount.toFixed(2)}`, 135, totalsY + 16);
    
    doc.setFont(undefined, 'bold');
    doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
    doc.setFontSize(12);
    doc.text(`${t.grandTotal}: ${t.currency}${order.total_amount.toFixed(2)}`, 135, totalsY + 26);

    // Payment details section
    const paymentY = totalsY + 50;
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
    doc.rect(20, paymentY, 170, 10, 'F');
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(t.paymentDetails, 25, paymentY + 6);

    // Payment details content
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(248, 248, 248);
    doc.rect(20, paymentY + 10, 170, 25, 'F');
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const accountHolder = bankAccount.use_anyname ? order.shops?.name : bankAccount.account_holder;
    doc.text(`${t.accountHolder}: ${accountHolder}`, 25, paymentY + 18);
    doc.text(`${t.iban}: ${bankAccount.iban}`, 25, paymentY + 24);
    
    if (bankAccount.bic) {
      doc.text(`${t.bic}: ${bankAccount.bic}`, 25, paymentY + 30);
    }
    
    doc.text(`${t.paymentReference}: ${order.order_number}`, 25, paymentY + (bankAccount.bic ? 36 : 30));

    // Footer section
    const footerY = 250;
    doc.setFillColor(248, 248, 248);
    doc.rect(0, footerY, 210, 47, 'F');
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    
    // Four column footer
    const colWidth = 47;
    let colX = 10;
    
    // Column 1: Company
    doc.setFont(undefined, 'bold');
    doc.text(order.shops?.company_name || '', colX, footerY + 8);
    doc.setFont(undefined, 'normal');
    doc.text(order.shops?.company_address || '', colX, footerY + 13);
    doc.text(`${order.shops?.company_postcode} ${order.shops?.company_city}`, colX, footerY + 17);
    
    // Column 2: Contact
    colX += colWidth;
    doc.setFont(undefined, 'bold');
    doc.text('Kontakt', colX, footerY + 8);
    doc.setFont(undefined, 'normal');
    if (order.shops?.company_phone) {
      doc.text(order.shops.company_phone, colX, footerY + 13);
    }
    doc.text(order.shops?.company_email || '', colX, footerY + 17);
    if (order.shops?.company_website) {
      doc.text(order.shops.company_website, colX, footerY + 21);
    }
    
    // Column 3: Bank
    colX += colWidth;
    doc.setFont(undefined, 'bold');
    doc.text('Bankinformationen', colX, footerY + 8);
    doc.setFont(undefined, 'normal');
    doc.text(accountHolder || '', colX, footerY + 13);
    doc.text(bankAccount.iban, colX, footerY + 17);
    if (bankAccount.bic) {
      doc.text(bankAccount.bic, colX, footerY + 21);
    }
    
    // Column 4: Business data
    colX += colWidth;
    doc.setFont(undefined, 'bold');
    doc.text('Geschäftsdaten', colX, footerY + 8);
    doc.setFont(undefined, 'normal');
    if (order.shops?.business_owner) {
      doc.text(order.shops.business_owner, colX, footerY + 13);
    }
    if (order.shops?.vat_number) {
      doc.text(order.shops.vat_number, colX, footerY + 17);
    }

    console.log('Professional PDF generated with styled template matching InvoicePreview');
    
    const pdfOutput = doc.output('arraybuffer');
    const pdfBytes = new Uint8Array(pdfOutput);
    
    console.log(`PDF generated successfully, size: ${pdfBytes.length} bytes`);

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
