import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import jsPDF from 'https://esm.sh/jspdf@2.5.1'

// Import translations
import { getInvoiceTranslations, getProductTranslation } from './translations.ts'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function detectLanguage(order: any): string {
  if (order.language) {
    return order.language.toLowerCase();
  }
  
  if (order.shops?.language) {
    return order.shops.language.toLowerCase();
  }
  
  const countryCode = order.shops?.country_code?.toLowerCase();
  const countryToLanguage: { [key: string]: string } = {
    'de': 'de',
    'at': 'de',
    'ch': 'de',
    'us': 'en',
    'gb': 'en',
    'ca': 'en',
    'au': 'en',
    'fr': 'fr',
    'be': 'fr',
    'it': 'it',
    'es': 'es',
    'mx': 'es',
    'ar': 'es',
    'pl': 'pl',
    'nl': 'nl'
  };
  
  if (countryCode && countryToLanguage[countryCode]) {
    return countryToLanguage[countryCode];
  }
  
  return 'de';
}

function getImageDimensions(buffer: Uint8Array): { width: number; height: number } | null {
  try {
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] === 0xFF && buffer[offset + 1] === 0xC0) {
          const height = (buffer[offset + 5] << 8) | buffer[offset + 6];
          const width = (buffer[offset + 7] << 8) | buffer[offset + 8];
          return { width, height };
        }
        offset += 2 + ((buffer[offset + 2] << 8) | buffer[offset + 3]);
      }
    } else if (
      buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47
    ) {
      const width = (buffer[16] << 24) | (buffer[17] << 16) | (buffer[18] << 8) | buffer[19];
      const height = (buffer[20] << 24) | (buffer[21] << 16) | (buffer[22] << 8) | buffer[23];
      return { width, height };
    }
  } catch (error) {
    console.error('[LOGO] Error extracting dimensions:', error);
  }
  return null;
}

function wrapText(text: string, maxWidth: number, fontSize: number = 12): string[] {
  const charWidth = fontSize * 0.6;
  const maxChars = Math.floor(maxWidth / charWidth);
  
  if (text.length <= maxChars) {
    return [text];
  }
  
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
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, bankAccountId, newOrderNumber } = await req.json();
    console.log('Starting invoice generation for order:', orderId, 'with bank account:', bankAccountId, 'and new order number:', newOrderNumber);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        shops (
          id,
          name,
          address,
          city,
          postal_code,
          country,
          country_code,
          phone,
          email,
          vat_number,
          language,
          logo_url,
          bank_accounts (
            id,
            account_name,
            account_holder,
            iban,
            bic,
            bank_name,
            use_anyname
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    console.log('Order data:', {
      processing_mode: order.processing_mode,
      order_number: order.order_number
    });

    let bankAccount = null;
    if (bankAccountId) {
      console.log('Associating temporary bank account with order');
      const { data: tempBankAccount, error: tempBankError } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', bankAccountId)
        .single();

      if (!tempBankError && tempBankAccount) {
        bankAccount = tempBankAccount;
        
        const { error: updateError } = await supabase
          .from('orders')
          .update({ temp_bank_account_id: bankAccountId })
          .eq('id', orderId);

        if (updateError) {
          console.error('Error associating temp bank account:', updateError);
        } else {
          console.log('Successfully associated temporary bank account with order');
        }
      }
    }

    if (!bankAccount && order.shops.bank_accounts?.length > 0) {
      bankAccount = order.shops.bank_accounts[0];
    }

    if (!bankAccount) {
      throw new Error('No bank account available for invoice generation');
    }

    const language = detectLanguage(order);
    const t = getInvoiceTranslations(language);
    
    // Get the specific product name using the translation system
    const productName = getProductTranslation(order.product || 'standard', language);
    console.log('Using product name:', productName, 'for product:', order.product, 'in language:', language);

    const invoiceDate = new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US');
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US');

    // Generate invoice number
    const { data: existingInvoices } = await supabase
      .from('orders')
      .select('invoice_number')
      .not('invoice_number', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);

    let invoiceNumber: string;
    if (existingInvoices && existingInvoices.length > 0) {
      const lastInvoiceNumber = existingInvoices[0].invoice_number;
      const match = lastInvoiceNumber.match(/(\d{4})-(\d{4})/);
      if (match) {
        const year = parseInt(match[1]);
        const number = parseInt(match[2]);
        const currentYear = new Date().getFullYear();
        
        if (year === currentYear) {
          invoiceNumber = `${currentYear}-${String(number + 1).padStart(4, '0')}`;
        } else {
          invoiceNumber = `${currentYear}-0001`;
        }
      } else {
        invoiceNumber = `${new Date().getFullYear()}-0001`;
      }
    } else {
      invoiceNumber = `${new Date().getFullYear()}-0001`;
    }

    const doc = new jsPDF();
    
    // Logo handling
    if (order.shops.logo_url) {
      try {
        const logoUrl = `${order.shops.logo_url}?v=${Date.now()}`;
        console.log('[LOGO] Fetching logo:', logoUrl);
        
        const logoResponse = await fetch(logoUrl);
        if (logoResponse.ok) {
          const logoBuffer = await logoResponse.arrayBuffer();
          const logoData = new Uint8Array(logoBuffer);
          console.log('[LOGO] Image data fetched:', logoData.length, 'bytes');
          
          const contentType = logoResponse.headers.get('content-type') || '';
          console.log('[LOGO] Detecting format from content-type:', contentType);
          
          let format = 'JPEG';
          if (contentType.includes('png')) {
            format = 'PNG';
            console.log('[LOGO] Format detected: PNG');
          } else {
            console.log('[LOGO] Format detected: JPEG');
          }
          
          const dimensions = getImageDimensions(logoData);
          if (dimensions) {
            console.log(`[LOGO] ${format} dimensions:`, dimensions.width + 'x' + dimensions.height);
          }
          
          const base64Data = btoa(String.fromCharCode(...logoData));
          console.log('[LOGO] Logo processed: format=' + format + ', base64=' + base64Data.length + ' chars');
          
          const maxWidth = 25;
          const maxHeight = 18;
          const originalWidth = dimensions?.width || 100;
          const originalHeight = dimensions?.height || 60;
          
          console.log('[LOGO] Calculating proportions: original ' + originalWidth + 'x' + originalHeight + ', max ' + maxWidth + 'x' + maxHeight);
          
          const aspectRatio = originalWidth / originalHeight;
          let finalWidth = maxWidth;
          let finalHeight = maxWidth / aspectRatio;
          
          if (finalHeight > maxHeight) {
            finalHeight = maxHeight;
            finalWidth = maxHeight * aspectRatio;
          }
          
          const xOffset = (maxWidth - finalWidth) / 2;
          const yOffset = (maxHeight - finalHeight) / 2;
          
          console.log('[LOGO] Final proportions:', finalWidth + 'x' + finalHeight + 'mm with offsets (' + xOffset + ', ' + yOffset + ')');
          
          console.log('[LOGO] Rendering responsive logo at (20, 20)');
          console.log('[LOGO] Rendering at (' + (20 + xOffset).toFixed(2) + ', ' + (20 + 1.5 + yOffset).toFixed(2) + ') size ' + finalWidth.toFixed(2) + 'x' + finalHeight.toFixed(2));
          
          doc.addImage(`data:image/${format.toLowerCase()};base64,${base64Data}`, format, 20 + xOffset, 20 + 1.5 + yOffset, finalWidth, finalHeight);
          console.log('[LOGO] Logo rendered successfully');
        }
      } catch (error) {
        console.error('[LOGO] Error loading logo:', error);
      }
    }
    
    // Company details (right side)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    
    const companyName = order.shops.name;
    const maxCompanyWidth = 39.3;
    
    console.log(`[WRAP] Text "${companyName}" (${(companyName.length * 0.6 * 12 / 10).toFixed(1)}mm) ${companyName.length * 0.6 * 12 > maxCompanyWidth * 10 ? 'exceeds' : 'fits in'} max width ${maxCompanyWidth}mm${companyName.length * 0.6 * 12 > maxCompanyWidth * 10 ? ', wrapping...' : ''}`);
    
    const companyLines = wrapText(companyName, maxCompanyWidth, 12);
    
    let yPos = 25;
    companyLines.forEach((line, index) => {
      doc.text(line, 210 - 20, yPos + (index * 5), { align: 'right' });
    });
    yPos += companyLines.length * 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    const addressLines = [
      order.shops.address,
      `${order.shops.postal_code} ${order.shops.city}`,
      order.shops.country
    ].filter(Boolean);
    
    addressLines.forEach(line => {
      doc.text(line, 210 - 20, yPos, { align: 'right' });
      yPos += 4;
    });
    
    if (order.shops.phone) {
      doc.text(`Tel: ${order.shops.phone}`, 210 - 20, yPos, { align: 'right' });
      yPos += 4;
    }
    
    if (order.shops.email) {
      doc.text(`Email: ${order.shops.email}`, 210 - 20, yPos, { align: 'right' });
      yPos += 4;
    }
    
    if (order.shops.vat_number) {
      doc.text(`${t.vatLabel} ${order.shops.vat_number}`, 210 - 20, yPos, { align: 'right' });
    }

    // Customer details (left side)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(t.customerDetails, 20, 80);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    let customerY = 90;
    
    const customerLines = [
      `${order.first_name} ${order.last_name}`,
      order.delivery_address,
      `${order.delivery_postal_code} ${order.delivery_city}`,
      order.delivery_country
    ].filter(Boolean);
    
    customerLines.forEach(line => {
      doc.text(line, 20, customerY);
      customerY += 5;
    });

    // Invoice header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(t.invoice, 20, 130);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`${t.invoiceNumber}: ${invoiceNumber}`, 20, 140);
    doc.text(`${t.invoiceDate}: ${invoiceDate}`, 20, 148);
    doc.text(`${t.dueDate}: ${dueDate}`, 20, 156);

    // Items table
    const tableY = 170;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    // Table headers
    doc.text(t.description, 20, tableY);
    doc.text(t.quantity, 100, tableY);
    doc.text(t.unitPrice, 130, tableY);
    doc.text(t.total, 170, tableY);
    
    // Table line
    doc.line(20, tableY + 2, 190, tableY + 2);
    
    // Items
    doc.setFont('helvetica', 'normal');
    const itemY = tableY + 10;
    
    // Use the translated product name instead of generic heating oil delivery
    doc.text(productName, 20, itemY);
    doc.text(`${order.quantity} ${t.liters}`, 100, itemY);
    doc.text(`${order.price_per_liter}${t.currency}`, 130, itemY);
    
    const subtotal = order.quantity * order.price_per_liter;
    doc.text(`${subtotal.toFixed(2)}${t.currency}`, 170, itemY);
    
    // Delivery fee if applicable
    let deliveryY = itemY;
    if (order.delivery_fee && order.delivery_fee > 0) {
      deliveryY += 8;
      doc.text(t.deliveryFee, 20, deliveryY);
      doc.text('1', 100, deliveryY);
      doc.text(`${order.delivery_fee}${t.currency}`, 130, deliveryY);
      doc.text(`${order.delivery_fee}${t.currency}`, 170, deliveryY);
    }

    // Totals
    const totalsY = deliveryY + 20;
    doc.line(130, totalsY - 5, 190, totalsY - 5);
    
    const finalSubtotal = subtotal + (order.delivery_fee || 0);
    doc.text(t.subtotal, 130, totalsY);
    doc.text(`${finalSubtotal.toFixed(2)}${t.currency}`, 170, totalsY);
    
    if (order.vat_amount && order.vat_amount > 0) {
      doc.text(`${t.vat} (${order.vat_rate}%)`, 130, totalsY + 8);
      doc.text(`${order.vat_amount.toFixed(2)}${t.currency}`, 170, totalsY + 8);
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text(t.grandTotal, 130, totalsY + 16);
    doc.text(`${order.total_amount.toFixed(2)}${t.currency}`, 170, totalsY + 16);

    // Payment details
    const paymentY = totalsY + 40;
    doc.setFont('helvetica', 'bold');
    doc.text(t.paymentDetails, 20, paymentY);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`${t.accountHolder}: ${bankAccount.account_holder}`, 20, paymentY + 10);
    doc.text(`${t.iban}: ${bankAccount.iban}`, 20, paymentY + 18);
    if (bankAccount.bic) {
      doc.text(`${t.bic}: ${bankAccount.bic}`, 20, paymentY + 26);
    }
    doc.text(`${t.paymentReference}: ${invoiceNumber}`, 20, paymentY + 34);
    doc.text(`${t.dueDays}`, 20, paymentY + 42);

    // Thank you note
    doc.setFont('helvetica', 'italic');
    doc.text(t.thankYou, 20, paymentY + 55);

    console.log('Responsive PDF content created with two-column address layout, converting to bytes...');
    
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBytes = new Uint8Array(pdfArrayBuffer);
    
    console.log('PDF conversion completed, size:', pdfBytes.length, 'bytes');
    console.log('Responsive PDF generated successfully, size:', pdfBytes.length, 'bytes');

    // Upload to Supabase storage - use translation for filename prefix and proper order number
    const orderNumberToUse = newOrderNumber || order.order_number;
    const filename = `${t.invoice.toLowerCase()}_${orderNumberToUse}_${language}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(filename, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    console.log('PDF uploaded successfully:', filename);

    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
      .getPublicUrl(filename);

    console.log('PDF public URL:', publicUrl);

    // Update order with invoice details
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        invoice_number: invoiceNumber,
        invoice_url: publicUrl,
        invoice_generated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    console.log('Order updated successfully with invoice details');

    return new Response(JSON.stringify({
      success: true,
      invoice_number: invoiceNumber,
      invoice_url: publicUrl,
      generated_at: new Date().toISOString(),
      language,
      filename,
      used_temp_bank_account: !!bankAccountId,
      order_number_used: orderNumberToUse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Invoice generation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
