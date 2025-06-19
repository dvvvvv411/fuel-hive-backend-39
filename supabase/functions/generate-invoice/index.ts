
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
    
    // Create new PDF document with A4 format and proper margins
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // A4 dimensions: 210mm x 297mm
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    
    // Calculate VAT details
    const vatRate = order.shops.vat_rate || 19;
    const totalWithoutVat = order.total_amount / (1 + vatRate / 100);
    const vatAmount = order.total_amount - totalWithoutVat;
    
    // Calculate due date (14 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    
    // Set font encoding to support special characters
    doc.setFont("helvetica", "normal");
    
    let yPos = margin + 10; // Start position
    
    // Company header with proper A4 positioning
    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235); // Blue color
    doc.text(order.shops.company_name, margin, yPos);
    yPos += 15;
    
    // Company details with proper spacing for A4
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(order.shops.company_address, margin, yPos);
    yPos += 4;
    doc.text(`${order.shops.company_postcode} ${order.shops.company_city}`, margin, yPos);
    yPos += 4;
    if (order.shops.company_phone) {
      doc.text(`Tel: ${order.shops.company_phone}`, margin, yPos);
      yPos += 4;
    }
    doc.text(`E-Mail: ${order.shops.company_email}`, margin, yPos);
    yPos += 4;
    if (order.shops.company_website) {
      doc.text(`Web: ${order.shops.company_website}`, margin, yPos);
      yPos += 4;
    }
    if (order.shops.vat_number) {
      doc.text(`USt-IdNr: ${order.shops.vat_number}`, margin, yPos);
    }
    
    // Customer address (positioned on the right side for proper invoice layout)
    yPos = margin + 10;
    const customerAddressX = margin + (contentWidth * 0.6);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(order.customer_name, customerAddressX, yPos);
    yPos += 5;
    doc.text(order.delivery_street, customerAddressX, yPos);
    yPos += 5;
    doc.text(`${order.delivery_postcode} ${order.delivery_city}`, customerAddressX, yPos);
    
    // Invoice title with proper A4 spacing
    yPos = margin + 60;
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text(t.invoice, margin, yPos);
    
    // Invoice details with proper table-like layout
    yPos += 20;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    const detailsStartY = yPos;
    const labelWidth = 50;
    
    doc.text(`${t.invoiceNumber}:`, margin, yPos);
    doc.text(invoiceNumber, margin + labelWidth, yPos);
    yPos += 6;
    
    doc.text(`${t.invoiceDate}:`, margin, yPos);
    doc.text(new Date().toLocaleDateString(order.shops.language === 'en' ? 'en-US' : 'de-DE'), margin + labelWidth, yPos);
    yPos += 6;
    
    doc.text(`${t.dueDate}:`, margin, yPos);
    doc.text(dueDate.toLocaleDateString(order.shops.language === 'en' ? 'en-US' : 'de-DE'), margin + labelWidth, yPos);
    yPos += 6;
    
    doc.text(`Bestellnummer:`, margin, yPos);
    doc.text(order.order_number, margin + labelWidth, yPos);
    yPos += 6;
    
    doc.text(`Bestelldatum:`, margin, yPos);
    doc.text(new Date(order.created_at).toLocaleDateString(order.shops.language === 'en' ? 'en-US' : 'de-DE'), margin + labelWidth, yPos);
    
    // Items table with proper A4 layout
    yPos += 25;
    const tableStartY = yPos;
    
    // Table header with background
    doc.setFillColor(37, 99, 235);
    doc.rect(margin, yPos - 3, contentWidth, 8, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(t.description, margin + 2, yPos + 2);
    doc.text(t.quantity, margin + (contentWidth * 0.55), yPos + 2);
    doc.text(t.unitPrice, margin + (contentWidth * 0.7), yPos + 2);
    doc.text(t.total, margin + (contentWidth * 0.85), yPos + 2);
    
    yPos += 12;
    
    // Table content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    
    // Main product line
    doc.text(t.heatingOilDelivery, margin + 2, yPos);
    doc.text(`${order.liters} ${t.liters}`, margin + (contentWidth * 0.55), yPos);
    doc.text(`${currencySymbol}${order.price_per_liter.toFixed(3)}`, margin + (contentWidth * 0.7), yPos);
    doc.text(`${currencySymbol}${order.base_price.toFixed(2)}`, margin + (contentWidth * 0.85), yPos);
    yPos += 6;
    
    // Delivery fee if applicable
    if (order.delivery_fee > 0) {
      doc.text(t.deliveryFee, margin + 2, yPos);
      doc.text('1', margin + (contentWidth * 0.55), yPos);
      doc.text(`${currencySymbol}${order.delivery_fee.toFixed(2)}`, margin + (contentWidth * 0.7), yPos);
      doc.text(`${currencySymbol}${order.delivery_fee.toFixed(2)}`, margin + (contentWidth * 0.85), yPos);
      yPos += 6;
    }
    
    // Table border
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, tableStartY - 3, contentWidth, yPos - tableStartY + 3);
    
    // Totals section with right alignment
    yPos += 15;
    const totalsX = margin + (contentWidth * 0.6);
    
    doc.setFontSize(10);
    doc.text(`${t.subtotal}:`, totalsX, yPos);
    doc.text(`${currencySymbol}${totalWithoutVat.toFixed(2)}`, totalsX + 40, yPos);
    yPos += 6;
    
    doc.text(`${t.vat} (${vatRate}%):`, totalsX, yPos);
    doc.text(`${currencySymbol}${vatAmount.toFixed(2)}`, totalsX + 40, yPos);
    yPos += 8;
    
    doc.setFontSize(12);
    doc.setTextColor(37, 99, 235);
    doc.text(`${t.grandTotal}:`, totalsX, yPos);
    doc.text(`${currencySymbol}${order.total_amount.toFixed(2)}`, totalsX + 40, yPos);
    
    // Payment details section
    if (order.shops.bank_accounts) {
      yPos += 25;
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.text(t.paymentDetails, margin, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      doc.text(`${t.accountHolder}:`, margin, yPos);
      doc.text(order.shops.bank_accounts.account_holder, margin + 35, yPos);
      yPos += 6;
      
      doc.text(`${t.iban}:`, margin, yPos);
      doc.text(order.shops.bank_accounts.iban, margin + 35, yPos);
      yPos += 6;
      
      if (order.shops.bank_accounts.bic) {
        doc.text(`${t.bic}:`, margin, yPos);
        doc.text(order.shops.bank_accounts.bic, margin + 35, yPos);
        yPos += 6;
      }
      
      doc.text(`${t.paymentReference}:`, margin, yPos);
      doc.text(invoiceNumber, margin + 35, yPos);
      yPos += 6;
      
      doc.text(`Zahlungsziel:`, margin, yPos);
      doc.text(t.dueDays, margin + 35, yPos);
    }
    
    // Footer with thank you message
    yPos = pageHeight - margin - 20;
    doc.setFontSize(10);
    doc.setTextColor(102, 102, 102);
    doc.text(t.thankYou, margin, yPos);
    
    console.log('PDF content created with A4 format, converting to bytes...');
    
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
