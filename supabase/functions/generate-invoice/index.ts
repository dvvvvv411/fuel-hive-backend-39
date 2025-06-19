
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getInvoiceTranslations } from "./translations.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  order_id: string;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const serve_handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { order_id }: RequestBody = await req.json();

    console.log('Starting invoice generation for order:', order_id);

    // Fetch order details with shop information to get language
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        shops!inner(
          id,
          name,
          company_name,
          company_address,
          company_postcode,
          company_city,
          company_phone,
          company_email,
          company_website,
          vat_number,
          business_owner,
          court_name,
          registration_number,
          language,
          currency,
          vat_rate,
          logo_url,
          bank_account_id,
          bank_accounts(
            account_name,
            account_holder,
            iban,
            bic,
            bank_name
          )
        )
      `)
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      throw new Error('Order not found');
    }

    console.log('Order fetched successfully:', order.order_number);
    console.log('Shop language:', order.shops.language);

    // Get translations based on shop language
    const t = getInvoiceTranslations(order.shops.language || 'de');
    const currency = order.shops.currency || 'EUR';
    const currencySymbol = t.currency;

    // Generate invoice number if not exists
    let invoiceNumber = order.invoice_number;
    if (!invoiceNumber) {
      const currentYear = new Date().getFullYear();
      const { data: lastInvoice } = await supabase
        .from('orders')
        .select('invoice_number')
        .not('invoice_number', 'is', null)
        .like('invoice_number', `${currentYear}-%`)
        .order('invoice_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      let nextNumber = 1;
      if (lastInvoice?.invoice_number) {
        const lastNumber = parseInt(lastInvoice.invoice_number.split('-')[1]);
        nextNumber = lastNumber + 1;
      }

      invoiceNumber = `${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
    }

    // Create localized filename
    const languageCode = order.shops.language || 'de';
    const filename = `${t.invoice.toLowerCase()}_${invoiceNumber.replace('/', '_')}_${languageCode}.pdf`;

    console.log('Generating PDF with filename:', filename);

    // Generate PDF content with translations
    const pdfContent = await generateInvoicePDF(order, invoiceNumber, t, currencySymbol);

    if (!pdfContent || pdfContent.length === 0) {
      console.error('PDF generation failed: empty content');
      throw new Error('Failed to generate PDF content');
    }

    console.log('PDF generated successfully, size:', pdfContent.length, 'bytes');

    // Upload PDF to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(filename, pdfContent, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      throw new Error('Failed to upload invoice PDF');
    }

    console.log('PDF uploaded successfully:', filename);

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from('invoices')
      .getPublicUrl(filename);

    console.log('PDF public URL:', publicUrl.publicUrl);

    // Update order with invoice details
    const updateData = {
      invoice_number: invoiceNumber,
      invoice_pdf_generated: true,
      invoice_pdf_url: publicUrl.publicUrl,
      invoice_generation_date: new Date().toISOString(),
      invoice_date: new Date().toISOString().split('T')[0]
    };

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order_id);

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw new Error('Failed to update order with invoice details');
    }

    console.log('Order updated successfully with invoice details');

    return new Response(
      JSON.stringify({
        success: true,
        invoice_number: invoiceNumber,
        invoice_url: publicUrl.publicUrl,
        generated_at: new Date().toISOString(),
        language: languageCode,
        filename: filename
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in generate-invoice function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

async function generateInvoicePDF(order: any, invoiceNumber: string, t: any, currencySymbol: string): Promise<Uint8Array> {
  try {
    console.log('Starting PDF generation...');
    
    // Import jsPDF dynamically
    const { jsPDF } = await import("https://esm.sh/jspdf@2.5.1");
    
    // Create new PDF document
    const doc = new jsPDF();
    
    // Calculate VAT details
    const vatRate = order.shops.vat_rate || 19;
    const totalWithoutVat = order.total_amount / (1 + vatRate / 100);
    const vatAmount = order.total_amount - totalWithoutVat;
    
    // Calculate due date (14 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    
    // Set font
    doc.setFont("helvetica", "normal");
    
    // Add company header
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235); // Blue color
    doc.text(order.shops.company_name, 20, 30);
    
    // Company details
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    let yPos = 40;
    doc.text(order.shops.company_address, 20, yPos);
    yPos += 5;
    doc.text(`${order.shops.company_postcode} ${order.shops.company_city}`, 20, yPos);
    yPos += 5;
    if (order.shops.company_phone) {
      doc.text(`Tel: ${order.shops.company_phone}`, 20, yPos);
      yPos += 5;
    }
    doc.text(`E-Mail: ${order.shops.company_email}`, 20, yPos);
    yPos += 5;
    if (order.shops.company_website) {
      doc.text(`Web: ${order.shops.company_website}`, 20, yPos);
      yPos += 5;
    }
    if (order.shops.vat_number) {
      doc.text(`USt-IdNr: ${order.shops.vat_number}`, 20, yPos);
    }
    
    // Invoice title
    doc.setFontSize(24);
    doc.setTextColor(37, 99, 235);
    doc.text(t.invoice, 20, 80);
    
    // Invoice details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    yPos = 100;
    doc.text(`${t.invoiceNumber}: ${invoiceNumber}`, 20, yPos);
    yPos += 8;
    doc.text(`${t.invoiceDate}: ${new Date().toLocaleDateString(order.shops.language === 'en' ? 'en-US' : 'de-DE')}`, 20, yPos);
    yPos += 8;
    doc.text(`${t.dueDate}: ${dueDate.toLocaleDateString(order.shops.language === 'en' ? 'en-US' : 'de-DE')}`, 20, yPos);
    yPos += 8;
    doc.text(`Bestellnummer: ${order.order_number}`, 20, yPos);
    yPos += 8;
    doc.text(`Bestelldatum: ${new Date(order.created_at).toLocaleDateString(order.shops.language === 'en' ? 'en-US' : 'de-DE')}`, 20, yPos);
    
    // Customer details
    yPos += 20;
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text(t.customerDetails, 20, yPos);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    yPos += 10;
    doc.text(order.customer_name, 20, yPos);
    yPos += 6;
    doc.text(order.delivery_street, 20, yPos);
    yPos += 6;
    doc.text(`${order.delivery_postcode} ${order.delivery_city}`, 20, yPos);
    yPos += 6;
    doc.text(order.customer_email, 20, yPos);
    if (order.customer_phone) {
      yPos += 6;
      doc.text(order.customer_phone, 20, yPos);
    }
    
    // Items table header
    yPos += 25;
    doc.setFontSize(12);
    doc.setFillColor(37, 99, 235);
    doc.setTextColor(255, 255, 255);
    doc.rect(20, yPos - 5, 170, 10, 'F');
    doc.text(t.description, 25, yPos);
    doc.text(t.quantity, 100, yPos);
    doc.text(t.unitPrice, 125, yPos);
    doc.text(t.total, 160, yPos);
    
    // Items
    yPos += 15;
    doc.setTextColor(0, 0, 0);
    doc.text(t.heatingOilDelivery, 25, yPos);
    doc.text(`${order.liters} ${t.liters}`, 100, yPos);
    doc.text(`${currencySymbol}${order.price_per_liter.toFixed(3)}`, 125, yPos);
    doc.text(`${currencySymbol}${order.base_price.toFixed(2)}`, 160, yPos);
    
    if (order.delivery_fee > 0) {
      yPos += 8;
      doc.text(t.deliveryFee, 25, yPos);
      doc.text('1', 100, yPos);
      doc.text(`${currencySymbol}${order.delivery_fee.toFixed(2)}`, 125, yPos);
      doc.text(`${currencySymbol}${order.delivery_fee.toFixed(2)}`, 160, yPos);
    }
    
    // Totals
    yPos += 20;
    doc.text(`${t.subtotal}: ${currencySymbol}${totalWithoutVat.toFixed(2)}`, 120, yPos);
    yPos += 8;
    doc.text(`${t.vat} (${vatRate}%): ${currencySymbol}${vatAmount.toFixed(2)}`, 120, yPos);
    yPos += 8;
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text(`${t.grandTotal}: ${currencySymbol}${order.total_amount.toFixed(2)}`, 120, yPos);
    
    // Payment details
    if (order.shops.bank_accounts) {
      yPos += 25;
      doc.setFontSize(14);
      doc.setTextColor(37, 99, 235);
      doc.text(t.paymentDetails, 20, yPos);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      yPos += 10;
      doc.text(`${t.accountHolder}: ${order.shops.bank_accounts.account_holder}`, 20, yPos);
      yPos += 6;
      doc.text(`${t.iban}: ${order.shops.bank_accounts.iban}`, 20, yPos);
      if (order.shops.bank_accounts.bic) {
        yPos += 6;
        doc.text(`${t.bic}: ${order.shops.bank_accounts.bic}`, 20, yPos);
      }
      yPos += 6;
      doc.text(`${t.paymentReference}: ${invoiceNumber}`, 20, yPos);
      yPos += 6;
      doc.text(`Zahlungsziel: ${t.dueDays}`, 20, yPos);
    }
    
    // Thank you message
    yPos += 20;
    doc.setFontSize(12);
    doc.setTextColor(102, 102, 102);
    doc.text(t.thankYou, 20, yPos);
    
    console.log('PDF content created, converting to bytes...');
    
    // Get PDF as array buffer
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBytes = new Uint8Array(pdfArrayBuffer);
    
    console.log('PDF conversion completed, size:', pdfBytes.length, 'bytes');
    
    return pdfBytes;
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}

serve(serve_handler);
