import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "npm:jspdf@2.5.1";
import { getTranslations, detectLanguage } from './translations.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateInvoiceRequest {
  order_id: string;
  language?: string;
}

const formatIBAN = (iban: string): string => {
  // Remove any existing spaces and convert to uppercase
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  
  // Add spaces every 4 characters
  return cleanIban.replace(/(.{4})/g, '$1 ').trim();
};

const processLogoUrl = (logoUrl: string): string => {
  if (!logoUrl) return '';
  
  // Add timestamp to force refresh and avoid caching issues
  const separator = logoUrl.includes('?') ? '&' : '?';
  return `${logoUrl}${separator}v=${Date.now()}`;
};

const extractImageDimensions = (format: string, data: Uint8Array): { width: number; height: number } => {
  console.log(`[LOGO] Extracting dimensions for: ${format}`);
  
  if (format === 'PNG') {
    // PNG header starts at byte 16 for IHDR chunk
    const width = new DataView(data.buffer).getUint32(16, false); // big-endian
    const height = new DataView(data.buffer).getUint32(20, false); // big-endian
    console.log(`[LOGO] PNG dimensions: ${width}x${height}`);
    return { width, height };
  } else if (format === 'JPEG') {
    // JPEG dimensions are more complex to extract, simplified approach
    let i = 2; // Skip SOI marker
    while (i < data.length) {
      if (data[i] === 0xFF && data[i + 1] === 0xC0) { // SOF0 marker
        const height = (data[i + 5] << 8) | data[i + 6];
        const width = (data[i + 7] << 8) | data[i + 8];
        console.log(`[LOGO] JPEG dimensions: ${width}x${height}`);
        return { width, height };
      }
      i++;
    }
  }
  
  // Fallback dimensions
  console.log(`[LOGO] Using fallback dimensions for ${format}`);
  return { width: 200, height: 100 };
};

const detectImageFormat = (contentType: string, data: Uint8Array): string => {
  console.log(`[LOGO] Detecting format from content-type: ${contentType}`);
  
  if (contentType.includes('png')) {
    console.log(`[LOGO] Format detected: PNG`);
    return 'PNG';
  } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
    console.log(`[LOGO] Format detected: JPEG`);
    return 'JPEG';
  }
  
  // Fallback: check file signature
  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47) {
    console.log(`[LOGO] Format detected by signature: PNG`);
    return 'PNG';
  } else if (data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF) {
    console.log(`[LOGO] Format detected by signature: JPEG`);
    return 'JPEG';
  }
  
  console.log(`[LOGO] Format detection failed, defaulting to PNG`);
  return 'PNG';
};

const processShopLogo = async (logoUrl: string): Promise<{ format: string; base64: string; width: number; height: number } | null> => {
  if (!logoUrl) {
    console.log('[LOGO] No logo URL provided');
    return null;
  }

  try {
    console.log(`[LOGO] Processing shop logo: ${logoUrl}`);
    const processedUrl = processLogoUrl(logoUrl);
    console.log(`[LOGO] Fetching logo: ${processedUrl}`);
    
    const response = await fetch(processedUrl);
    if (!response.ok) {
      console.error(`[LOGO] Failed to fetch logo: ${response.status} ${response.statusText}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    
    console.log(`[LOGO] Image data fetched: ${data.length} bytes`);
    
    const format = detectImageFormat(contentType, data);
    const { width, height } = extractImageDimensions(format, data);
    
    // Convert to base64
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    const base64 = btoa(binary);
    
    console.log(`[LOGO] Logo processed: format=${format}, base64=${base64.length} chars`);
    
    return { format, base64, width, height };
  } catch (error) {
    console.error('[LOGO] Error processing logo:', error);
    return null;
  }
};

const calculateResponsiveLayout = (language: string) => {
  console.log(`[LAYOUT] Calculating responsive layout for language: ${language}`);
  
  // Base measurements in mm
  const pageWidth = 210; // A4 width
  const pageHeight = 297; // A4 height
  const margin = 20;
  const contentWidth = pageWidth - (2 * margin);
  const availableHeight = pageHeight - (2 * margin);

  // Header section
  const headerHeight = 40;
  
  // Invoice info section
  const invoiceInfoHeight = 25;
  
  // Address section (side by side)
  const addressSectionHeight = 35;
  
  // Table header
  const tableHeaderHeight = 12;
  
  // Table rows (dynamic based on content)
  const itemRowHeight = 8;
  const numberOfItems = 1; // Usually one product line
  const tableContentHeight = numberOfItems * itemRowHeight;
  
  // Summary section
  const summaryHeight = 25;
  
  // Footer
  const footerHeight = 15;
  
  // Calculate total required height
  const requiredHeight = headerHeight + invoiceInfoHeight + addressSectionHeight + 
                         tableHeaderHeight + tableContentHeight + summaryHeight + footerHeight + 40; // 40mm extra spacing
  
  console.log(`[LAYOUT] Required content height: ${requiredHeight}mm, Available: ${availableHeight}mm`);
  
  // Calculate scaling factor if needed
  const scalingFactor = requiredHeight > availableHeight ? availableHeight / requiredHeight : 1.0;
  console.log(`[LAYOUT] Scaling factor: ${scalingFactor.toFixed(3)}`);
  
  // Y positions for each section
  let currentY = margin;
  const positions = {
    header: currentY,
    invoiceInfo: (currentY += headerHeight * scalingFactor),
    addresses: (currentY += invoiceInfoHeight * scalingFactor),
    tableHeader: (currentY += addressSectionHeight * scalingFactor),
    tableContent: (currentY += tableHeaderHeight * scalingFactor),
    summary: (currentY += tableContentHeight * scalingFactor),
    footer: (currentY += summaryHeight * scalingFactor)
  };
  
  console.log(`[LAYOUT] Dynamic layout calculated with ${Object.keys(positions).length} positions`);
  
  return {
    pageWidth,
    pageHeight,
    margin,
    contentWidth,
    scalingFactor,
    positions
  };
};

const generateResponsivePDF = async (order: any, bankData: any, language: string = 'de') => {
  console.log('Starting responsive PDF generation with language:', language);
  
  const t = getTranslations(language);
  const layout = calculateResponsiveLayout(language);
  
  // Initialize PDF with correct constructor
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Set default font
  pdf.setFont('helvetica');

  // Process logo if available
  let logoData = null;
  if (order.shops?.logo_url) {
    console.log(`[LOGO] Rendering responsive logo at (${layout.margin}, ${layout.positions.header})`);
    logoData = await processShopLogo(order.shops.logo_url);
    
    if (logoData) {
      console.log(`[LOGO] Original dimensions: ${logoData.width}x${logoData.height}`);
      
      // Calculate responsive logo size
      const maxLogoWidth = 25 * layout.scalingFactor; // 25mm max width
      const maxLogoHeight = 18 * layout.scalingFactor; // 18mm max height
      
      console.log(`[LOGO] Calculating proportions: original ${logoData.width}x${logoData.height}, max ${maxLogoWidth.toFixed(1)}x${maxLogoHeight.toFixed(1)}`);
      
      const widthRatio = maxLogoWidth / logoData.width;
      const heightRatio = maxLogoHeight / logoData.height;
      const ratio = Math.min(widthRatio, heightRatio);
      
      const logoWidth = logoData.width * ratio;
      const logoHeight = logoData.height * ratio;
      
      // Center the logo vertically within the header space
      const logoY = layout.positions.header + (maxLogoHeight - logoHeight) / 2;
      
      console.log(`[LOGO] Final proportions: ${logoWidth.toFixed(1)}x${logoHeight.toFixed(1)}mm with offsets (0.0, ${((maxLogoHeight - logoHeight) / 2).toFixed(1)})`);
      console.log(`[LOGO] Rendering at (${layout.margin.toFixed(2)}, ${logoY.toFixed(2)}) size ${logoWidth.toFixed(2)}x${logoHeight.toFixed(2)}`);
      
      pdf.addImage(
        `data:image/${logoData.format.toLowerCase()};base64,${logoData.base64}`,
        logoData.format,
        layout.margin,
        logoY,
        logoWidth,
        logoHeight
      );
      
      console.log(`[LOGO] Logo rendered successfully`);
    }
  }

  // Use temp_order_number if available, otherwise use original order_number
  const orderNumberForInvoice = order.temp_order_number || order.order_number;
  console.log('Using order number for invoice:', orderNumberForInvoice);

  // Header - Company name and title
  pdf.setFontSize(20 * layout.scalingFactor);
  pdf.setFont('helvetica', 'bold');
  pdf.text(order.shops?.company_name || order.shops?.name || 'Company', 
           layout.pageWidth - layout.margin, layout.positions.header + 5, { align: 'right' });

  pdf.setFontSize(16 * layout.scalingFactor);
  pdf.text(t.invoice, layout.pageWidth - layout.margin, layout.positions.header + 15, { align: 'right' });

  // Invoice details
  pdf.setFontSize(10 * layout.scalingFactor);
  pdf.setFont('helvetica', 'normal');
  
  const invoiceDate = new Date(order.invoice_date || order.created_at);
  const formattedDate = invoiceDate.toLocaleDateString(
    language === 'de' ? 'de-DE' : 
    language === 'en' ? 'en-US' : 
    language === 'fr' ? 'fr-FR' : 
    language === 'it' ? 'it-IT' : 
    language === 'es' ? 'es-ES' : 
    language === 'pl' ? 'pl-PL' : 'nl-NL'
  );
  
  pdf.text(`${t.invoiceNumber}: ${orderNumberForInvoice}`, layout.margin, layout.positions.invoiceInfo);
  pdf.text(`${t.invoiceDate}: ${formattedDate}`, layout.margin, layout.positions.invoiceInfo + 5);

  // Two-column address layout
  const leftColumnX = layout.margin;
  const rightColumnX = layout.margin + (layout.contentWidth / 2) + 10;
  const columnWidth = (layout.contentWidth / 2) - 10;

  // Billing address (left column)
  pdf.setFont('helvetica', 'bold');
  pdf.text(t.billingAddress, leftColumnX, layout.positions.addresses);
  pdf.setFont('helvetica', 'normal');
  
  let billingY = layout.positions.addresses + 5;
  pdf.text(`${order.delivery_first_name} ${order.delivery_last_name}`, leftColumnX, billingY);
  pdf.text(order.delivery_street, leftColumnX, billingY + 4);
  pdf.text(`${order.delivery_postcode} ${order.delivery_city}`, leftColumnX, billingY + 8);

  // Payment information (right column)
  if (bankData) {
    pdf.setFont('helvetica', 'bold');
    pdf.text(t.paymentInfo, rightColumnX, layout.positions.addresses);
    pdf.setFont('helvetica', 'normal');
    
    let paymentY = layout.positions.addresses + 5;
    pdf.text(`${t.recipient}: ${bankData.account_holder || order.shops?.company_name || 'N/A'}`, rightColumnX, paymentY);
    pdf.text(`${t.bank}: ${bankData.bank_name || 'N/A'}`, rightColumnX, paymentY + 4);
    pdf.text(`IBAN: ${formatIBAN(bankData.iban || '')}`, rightColumnX, paymentY + 8);
    if (bankData.bic) {
      pdf.text(`BIC: ${bankData.bic}`, rightColumnX, paymentY + 12);
    }
  }

  // Table header
  pdf.setFont('helvetica', 'bold');
  pdf.setFillColor(240, 240, 240);
  pdf.rect(layout.margin, layout.positions.tableHeader, layout.contentWidth, 8, 'F');
  
  pdf.text(t.description, layout.margin + 2, layout.positions.tableHeader + 5);
  pdf.text(t.quantity, layout.margin + 80, layout.positions.tableHeader + 5);
  pdf.text(t.unitPrice, layout.margin + 110, layout.positions.tableHeader + 5);
  pdf.text(t.total, layout.margin + 150, layout.positions.tableHeader + 5);

  // Table content
  pdf.setFont('helvetica', 'normal');
  const translatedProduct = t.products[order.product] || order.product;
  
  let tableY = layout.positions.tableContent + 5;
  pdf.text(translatedProduct, layout.margin + 2, tableY);
  pdf.text(`${order.liters} ${t.liters}`, layout.margin + 80, tableY);
  pdf.text(`€${order.price_per_liter.toFixed(2)}`, layout.margin + 110, tableY);
  pdf.text(`€${(order.liters * order.price_per_liter).toFixed(2)}`, layout.margin + 150, tableY);

  // Delivery fee if applicable
  if (order.delivery_fee > 0) {
    tableY += 6;
    pdf.text(t.deliveryFee, layout.margin + 2, tableY);
    pdf.text('1', layout.margin + 80, tableY);
    pdf.text(`€${order.delivery_fee.toFixed(2)}`, layout.margin + 110, tableY);
    pdf.text(`€${order.delivery_fee.toFixed(2)}`, layout.margin + 150, tableY);
  }

  // Summary
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${t.totalAmount}: €${order.total_amount.toFixed(2)}`, layout.margin + 150, layout.positions.summary + 5);

  // Footer
  pdf.setFontSize(8 * layout.scalingFactor);
  pdf.setFont('helvetica', 'normal');
  
  let footerText = `${order.shops?.company_name} • ${order.shops?.company_address} • ${order.shops?.company_postcode} ${order.shops?.company_city}`;
  if (order.shops?.vat_number) {
    footerText += ` • ${t.vatLabel} ${order.shops.vat_number}`;
  }
  
  pdf.text(footerText, layout.pageWidth / 2, layout.positions.footer, { align: 'center' });

  console.log('Responsive PDF content created with two-column address layout, converting to bytes...');
  
  const pdfBytes = pdf.output('arraybuffer');
  console.log('PDF conversion completed, size:', pdfBytes.byteLength, 'bytes');
  
  return pdfBytes;
};

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
    const { order_id, language }: GenerateInvoiceRequest = await req.json();
    console.log('Starting invoice generation for order:', order_id);
    console.log('Requested language:', language);

    // Get order with shop details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        shops (
          name,
          company_name,
          company_email,
          company_address,
          company_city,
          company_postcode,
          vat_number,
          logo_url,
          country_code,
          language,
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

    console.log('Order fetched successfully:', order.order_number);

    // Detect language for the invoice
    const finalLanguage = language || detectLanguage(order);
    console.log('Final language for PDF:', finalLanguage);

    // PRIORITY ORDER FOR BANK ACCOUNT SELECTION:
    // 1. selected_bank_account_id from the order (highest priority)
    // 2. Temporary bank account associated with this order
    // 3. Shop's default bank account (fallback)
    
    let bankData = null;
    console.log('Looking for bank account in priority order...');
    
    // Priority 1: Check for selected_bank_account_id in the order
    if (order.selected_bank_account_id) {
      console.log('Found selected_bank_account_id in order:', order.selected_bank_account_id);
      
      const { data: selectedBank, error: selectedBankError } = await supabase
        .from('bank_accounts')
        .select('account_holder, bank_name, iban, bic, use_anyname, account_name')
        .eq('id', order.selected_bank_account_id)
        .eq('active', true)
        .single();

      if (!selectedBankError && selectedBank) {
        console.log('Using selected bank account from order:', selectedBank.account_name);
        bankData = {
          ...selectedBank,
          account_holder: selectedBank.use_anyname ? order.shops.company_name : selectedBank.account_holder
        };
      } else {
        console.warn('Selected bank account not found or inactive:', selectedBankError);
      }
    }
    
    // Priority 2: If no selected bank account, check for temporary bank account
    if (!bankData) {
      console.log('No selected bank account, checking for temporary bank account...');
      
      const { data: tempBankAccount, error: tempBankError } = await supabase
        .from('bank_accounts')
        .select('account_holder, bank_name, iban, bic, use_anyname, account_name')
        .eq('is_temporary', true)
        .eq('used_for_order_id', order_id)
        .eq('active', true)
        .maybeSingle();

      if (tempBankAccount && !tempBankError) {
        console.log('Using temporary bank account:', tempBankAccount.account_name);
        bankData = {
          ...tempBankAccount,
          account_holder: tempBankAccount.use_anyname ? order.shops.company_name : tempBankAccount.account_holder
        };
      } else if (tempBankError) {
        console.warn('Error fetching temporary bank account:', tempBankError);
      } else {
        console.log('No temporary bank account found for this order');
      }
    }
    
    // Priority 3: Fallback to shop's default bank account
    if (!bankData && order.shops?.bank_account_id) {
      console.log('Using shop default bank account as fallback:', order.shops.bank_account_id);
      
      const { data: defaultBank, error: bankError } = await supabase
        .from('bank_accounts')
        .select('account_holder, bank_name, iban, bic, use_anyname, account_name')
        .eq('id', order.shops.bank_account_id)
        .eq('active', true)
        .single();

      if (!bankError && defaultBank) {
        console.log('Using shop default bank account:', defaultBank.account_name);
        bankData = {
          ...defaultBank,
          account_holder: defaultBank.use_anyname ? order.shops.company_name : defaultBank.account_holder
        };
      } else {
        console.warn('Could not fetch shop default bank data:', bankError);
      }
    }

    if (!bankData) {
      console.warn('No bank account found - invoice will be generated without payment information');
    } else {
      console.log('Bank account selected for invoice:', bankData.account_name);
    }

    // Generate filename based on language and order number
    const orderNumberForFilename = order.temp_order_number || order.order_number;
    const t = getTranslations(finalLanguage);
    const filename = `${t.invoiceFilename}_${orderNumberForFilename}_${finalLanguage}.pdf`;
    console.log('Generating responsive PDF with filename:', filename);

    // Generate PDF
    const pdfBuffer = await generateResponsivePDF(order, bankData, finalLanguage);
    console.log('Responsive PDF generated successfully, size:', pdfBuffer.byteLength, 'bytes');

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(filename, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    console.log('PDF uploaded successfully:', filename);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
      .getPublicUrl(filename);

    console.log('PDF public URL:', publicUrl);

    // Update order with invoice details
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        invoice_pdf_url: publicUrl,
        invoice_pdf_generated: true,
        invoice_generation_date: new Date().toISOString(),
        invoice_date: order.invoice_date || new Date().toISOString().split('T')[0]
      })
      .eq('id', order_id);

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    console.log('Order updated successfully with invoice details');

    return new Response(JSON.stringify({
      success: true,
      pdf_url: publicUrl,
      filename: filename,
      language: finalLanguage,
      bank_account_used: bankData?.account_name || 'none',
      order_number: orderNumberForFilename,
      generated_at: new Date().toISOString()
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
