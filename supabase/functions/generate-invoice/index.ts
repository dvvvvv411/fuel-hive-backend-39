
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
        .single();

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

    // Generate PDF content with translations
    const pdfContent = await generateInvoicePDF(order, invoiceNumber, t, currencySymbol);

    // Upload PDF to Supabase Storage (we'll create this bucket)
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
  // Simple HTML-to-PDF generation (in a real implementation, you'd use a proper PDF library)
  // For now, this is a placeholder that returns a basic PDF structure
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${t.invoice} ${invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .company-info { text-align: right; }
        .invoice-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
        .invoice-details { margin-bottom: 30px; }
        .customer-info { margin-bottom: 30px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        .items-table th { background-color: #f5f5f5; }
        .totals { margin-left: auto; width: 300px; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .grand-total { font-weight: bold; border-top: 2px solid #000; padding-top: 10px; }
        .payment-info { margin-top: 40px; }
        .thank-you { margin-top: 40px; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-details">
          <h2>${order.shops.company_name}</h2>
          <p>${order.shops.company_address}</p>
          <p>${order.shops.company_postcode} ${order.shops.company_city}</p>
          <p>${t.phoneLabel}: ${order.shops.company_phone}</p>
          <p>${t.emailLabel}: ${order.shops.company_email}</p>
          ${order.shops.vat_number ? `<p>${t.vatNumber}: ${order.shops.vat_number}</p>` : ''}
        </div>
      </div>

      <div class="invoice-title">${t.invoice}</div>

      <div class="invoice-details">
        <p><strong>${t.invoiceNumber}:</strong> ${invoiceNumber}</p>
        <p><strong>${t.invoiceDate}:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>${t.dueDate}:</strong> ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
      </div>

      <div class="customer-info">
        <h3>${t.customerDetails}</h3>
        <p>${order.customer_name}</p>
        <p>${order.delivery_street}</p>
        <p>${order.delivery_postcode} ${order.delivery_city}</p>
        <p>${order.customer_email}</p>
        ${order.customer_phone ? `<p>${order.customer_phone}</p>` : ''}
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>${t.description}</th>
            <th>${t.quantity}</th>
            <th>${t.unitPrice}</th>
            <th>${t.total}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${t.heatingOilDelivery}</td>
            <td>${order.liters} ${t.liters}</td>
            <td>${currencySymbol}${order.price_per_liter.toFixed(2)}</td>
            <td>${currencySymbol}${order.base_price.toFixed(2)}</td>
          </tr>
          ${order.delivery_fee > 0 ? `
          <tr>
            <td>${t.deliveryFee}</td>
            <td>1</td>
            <td>${currencySymbol}${order.delivery_fee.toFixed(2)}</td>
            <td>${currencySymbol}${order.delivery_fee.toFixed(2)}</td>
          </tr>
          ` : ''}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>${t.subtotal}:</span>
          <span>${currencySymbol}${(order.total_amount / (1 + (order.shops.vat_rate || 19) / 100)).toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>${t.vat} (${order.shops.vat_rate || 19}%):</span>
          <span>${currencySymbol}${(order.total_amount - (order.total_amount / (1 + (order.shops.vat_rate || 19) / 100))).toFixed(2)}</span>
        </div>
        <div class="total-row grand-total">
          <span>${t.grandTotal}:</span>
          <span>${currencySymbol}${order.total_amount.toFixed(2)}</span>
        </div>
      </div>

      ${order.shops.bank_accounts ? `
      <div class="payment-info">
        <h3>${t.paymentDetails}</h3>
        <p><strong>${t.accountHolder}:</strong> ${order.shops.bank_accounts.account_holder}</p>
        <p><strong>${t.iban}:</strong> ${order.shops.bank_accounts.iban}</p>
        ${order.shops.bank_accounts.bic ? `<p><strong>${t.bic}:</strong> ${order.shops.bank_accounts.bic}</p>` : ''}
        <p><strong>${t.paymentReference}:</strong> ${invoiceNumber}</p>
      </div>
      ` : ''}

      <div class="thank-you">
        <p>${t.thankYou}</p>
      </div>
    </body>
    </html>
  `;

  // Convert HTML to PDF bytes (this is a simplified placeholder)
  // In a real implementation, you would use a library like Puppeteer or similar
  const encoder = new TextEncoder();
  return encoder.encode(htmlContent);
}

serve(serve_handler);
