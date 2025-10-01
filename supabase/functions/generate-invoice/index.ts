import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@3.0.1";
import { getTranslations, detectLanguage, getPDFTranslations } from './translations.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateInvoiceRequest {
  order_id: string;
  language?: string;
  deposit_note?: string;
  deposit_percentage?: number;
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

// PDF font selection based on language for character compatibility
const getPDFFont = (language: string): string => {
  switch (language?.toLowerCase()) {
    case 'pl':
      return 'times'; // Times font has better Polish character support
    default:
      return 'helvetica'; // Default for German and other languages
  }
};

// Currency utility functions
const getCurrencySymbol = (currency: string): string => {
  switch (currency?.toUpperCase()) {
    case 'EUR':
      return '€';
    case 'PLN':
      return 'PLN';
    case 'USD':
      return '$';
    case 'GBP':
      return '£';
    default:
      return '€';
  }
};

// Helper function to calculate dynamic label width
const calculateLabelWidth = (pdf: any, labels: string[], fontSize: number = 10, language: string = 'de'): number => {
  pdf.setFontSize(fontSize);
  pdf.setFont(getPDFFont(language), 'bold');
  
  let maxWidth = 0;
  labels.forEach(label => {
    const width = pdf.getTextWidth(label + ':');
    if (width > maxWidth) {
      maxWidth = width;
    }
  });
  
  // Add some padding and ensure minimum/maximum widths
  const paddedWidth = maxWidth + 3; // 3mm padding
  const minWidth = 25; // Minimum 25mm
  const maxWidth2 = 50; // Maximum 50mm to prevent excessive spacing
  
  return Math.max(minWidth, Math.min(maxWidth2, paddedWidth));
};

// Helper function to calculate column widths for footer
const calculateFooterColumnWidths = (pdf: any, t: any, pageWidth: number, margin: number, language: string = 'de'): number[] => {
  const totalWidth = pageWidth - (2 * margin);
  const baseColumnWidth = totalWidth / 4;
  
  // Calculate required widths for each column based on content
  pdf.setFontSize(8);
  pdf.setFont(getPDFFont(language), 'normal');
  
  const column1Width = Math.max(baseColumnWidth, pdf.getTextWidth(t.businessData) + 5);
  const column2Width = Math.max(baseColumnWidth, pdf.getTextWidth(t.contact) + 5);
  const column3Width = Math.max(baseColumnWidth, pdf.getTextWidth(t.bankInformation) + 5);
  const column4Width = Math.max(baseColumnWidth, pdf.getTextWidth(t.businessData) + 5);
  
  // Ensure total doesn't exceed available space
  const totalCalculated = column1Width + column2Width + column3Width + column4Width;
  if (totalCalculated > totalWidth) {
    // Scale down proportionally
    const scale = totalWidth / totalCalculated;
    return [
      column1Width * scale,
      column2Width * scale,
      column3Width * scale,
      column4Width * scale
    ];
  }
  
  return [column1Width, column2Width, column3Width, column4Width];
};

const generateResponsivePDF = async (order: any, bankData: any, language: string = 'de', depositNote?: string) => {
  console.log('Starting PDF generation matching InvoicePreview template with language:', language);

  const t = getPDFTranslations(language);
  
  // Initialize PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Set default font
  pdf.setFont(getPDFFont(language));

  // Page dimensions
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  
  // Get accent color from shop or default
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

  // Process logo if available
  let logoData = null;
  if (order.shops?.logo_url) {
    console.log(`[LOGO] Processing logo for PDF`);
    logoData = await processShopLogo(order.shops.logo_url);
  }

  let currentY = margin;

  // MODERN HEADER - matching InvoicePreview layout
  // Logo section (left side)
  if (logoData) {
    console.log(`[LOGO] Adding logo to PDF`);
    
    // Calculate logo size (max 40mm width, 32mm height as in template)
    const maxLogoWidth = 40;
    const maxLogoHeight = 32;
    
    const widthRatio = maxLogoWidth / logoData.width;
    const heightRatio = maxLogoHeight / logoData.height;
    const ratio = Math.min(widthRatio, heightRatio);
    
    const logoWidth = logoData.width * ratio;
    const logoHeight = logoData.height * ratio;
    
    pdf.addImage(
      `data:image/${logoData.format.toLowerCase()};base64,${logoData.base64}`,
      logoData.format,
      margin,
      currentY,
      logoWidth,
      logoHeight
    );
  }

  // Company details (right side of header)
  const companyStartX = margin + 46; // After logo space
  pdf.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
  pdf.setFontSize(20);
  pdf.setFont(getPDFFont(language), 'bold');
  pdf.text(order.shops?.company_name || 'Company', companyStartX, currentY + 8);

  // Company address and details
  pdf.setTextColor(128, 128, 128); // Gray color
  pdf.setFontSize(9);
  pdf.setFont(getPDFFont(language), 'normal');
  let detailY = currentY + 15;
  
  pdf.text(order.shops?.company_address || '', companyStartX, detailY);
  detailY += 4;
  pdf.text(`${order.shops?.company_postcode || ''} ${order.shops?.company_city || ''}`, companyStartX, detailY);
  detailY += 4;
  
  if (order.shops?.company_phone) {
    pdf.text(`${t.phone || 'Phone'}: ${order.shops.company_phone}`, companyStartX, detailY);
    detailY += 4;
  }
  
  pdf.text(`${t.email || 'Email'}: ${order.shops?.company_email || ''}`, companyStartX, detailY);
  detailY += 4;
  
  if (order.shops?.company_website) {
    pdf.text(`${t.website || 'Website'}: ${order.shops.company_website}`, companyStartX, detailY);
    detailY += 4;
  }
  
  if (order.shops?.vat_number) {
    pdf.text(`USt-IdNr: ${order.shops.vat_number}`, companyStartX, detailY);
  }

  currentY += 50; // Move down after header

  // INVOICE TITLE - matching template
  pdf.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
  pdf.setFontSize(24);
  pdf.setFont(getPDFFont(language), 'bold');
  pdf.text(t.invoice, margin, currentY);

  currentY += 20; // Space after title

  // TWO-COLUMN LAYOUT for addresses and invoice details
  const leftColumnX = margin;
  const rightColumnX = margin + 95; // Split page roughly in half
  const startY = currentY;

  // LEFT COLUMN - Addresses
  let leftY = startY;
  
  // Check if we need separate billing address
  const hasDifferentAddresses = order.billing_street && 
    (order.billing_street !== order.delivery_street || 
     order.billing_city !== order.delivery_city ||
     order.billing_postcode !== order.delivery_postcode);

  // Billing Address (if different)
  if (hasDifferentAddresses) {
    pdf.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
    pdf.setFontSize(11);
    pdf.setFont(getPDFFont(language), 'bold');
    pdf.text(t.billingAddress, leftColumnX, leftY);
    leftY += 6;
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont(getPDFFont(language), 'normal');
    const billingName = `${order.billing_first_name || order.delivery_first_name} ${order.billing_last_name || order.delivery_last_name}`;
    pdf.text(billingName, leftColumnX, leftY);
    leftY += 4;
    pdf.text(order.billing_street || '', leftColumnX, leftY);
    leftY += 4;
    pdf.text(`${order.billing_postcode || ''} ${order.billing_city || ''}`, leftColumnX, leftY);
    leftY += 8;
  }
  
  // Delivery Address
  pdf.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
  pdf.setFontSize(11);
  pdf.setFont(getPDFFont(language), 'bold');
  pdf.text(hasDifferentAddresses ? t.deliveryAddress : '', leftColumnX, leftY);
  leftY += hasDifferentAddresses ? 6 : 0;
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.setFont(getPDFFont(language), 'bold');
  const customerName = order.customer_name || `${order.delivery_first_name} ${order.delivery_last_name}`;
  pdf.text(customerName, leftColumnX, leftY);
  leftY += 4;
  
  pdf.setFont(getPDFFont(language), 'normal');
  pdf.text(order.delivery_street, leftColumnX, leftY);
  leftY += 4;
  pdf.text(`${order.delivery_postcode} ${order.delivery_city}`, leftColumnX, leftY);

  // RIGHT COLUMN - Invoice details with dynamic label width
  let rightY = startY;
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);

  const invoiceDate = new Date(order.invoice_date || order.created_at);
  const formattedDate = invoiceDate.toLocaleDateString(
    language === 'de' ? 'de-DE' : 
    language === 'en' ? 'en-US' : 
    language === 'fr' ? 'fr-FR' : 
    language === 'it' ? 'it-IT' : 
    language === 'es' ? 'es-ES' : 
    language === 'pl' ? 'pl-PL' : 'nl-NL'
  );

  const orderNumberForInvoice = order.temp_order_number || order.order_number;

  // Calculate dynamic label width for invoice details
  const invoiceLabels = [
    t.invoiceDate,
    t.orderNumber || 'Order Number',
    t.orderDate || 'Order Date'
  ];
  const invoiceLabelWidth = calculateLabelWidth(pdf, invoiceLabels, 10, language);

  // Invoice details with dynamic spacing
  pdf.setFont(getPDFFont(language), 'bold');
  pdf.text(`${t.invoiceDate}:`, rightColumnX, rightY);
  pdf.setFont(getPDFFont(language), 'normal');
  pdf.text(formattedDate, rightColumnX + invoiceLabelWidth, rightY);
  rightY += 5;

  pdf.setFont(getPDFFont(language), 'bold');
  pdf.text(`${t.orderNumber || 'Order Number'}:`, rightColumnX, rightY);
  pdf.setFont(getPDFFont(language), 'normal');
  pdf.text(orderNumberForInvoice, rightColumnX + invoiceLabelWidth, rightY);
  rightY += 5;

  pdf.setFont(getPDFFont(language), 'bold');
  pdf.text(`${t.orderDate || 'Order Date'}:`, rightColumnX, rightY);
  pdf.setFont(getPDFFont(language), 'normal');
  const orderDate = new Date(order.created_at);
  pdf.text(orderDate.toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE'), rightColumnX + invoiceLabelWidth, rightY);

  currentY = Math.max(leftY, rightY) + 15; // Move below both columns

  // ITEMS TABLE with modern styling - matching template
  const tableStartY = currentY;
  const tableWidth = pageWidth - (2 * margin);
  
  // Table header with accent color background
  pdf.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
  pdf.rect(margin, tableStartY, tableWidth, 12, 'F');
  
  // Table header text
  pdf.setTextColor(255, 255, 255); // White text
  pdf.setFontSize(10);
  pdf.setFont(getPDFFont(language), 'normal');
  pdf.text(t.description, margin + 3, tableStartY + 8);
  pdf.text(t.quantity, margin + 80, tableStartY + 8);
  pdf.text(t.unitPrice, margin + 115, tableStartY + 8);
  pdf.text(t.total, margin + 150, tableStartY + 8);

  // Table content with alternating row colors
  currentY = tableStartY + 12;
  
  // Main product row (gray background as in template)
  pdf.setFillColor(248, 248, 248); // Light gray
  pdf.rect(margin, currentY, tableWidth, 8, 'F');
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.setFont(getPDFFont(language), 'normal');
  
  const translatedProduct = t.products[order.product] || order.product;
  const productName = translatedProduct === 'heating_oil' ? t.heatingOilDelivery || 'Heating Oil Delivery' : translatedProduct;
  
  pdf.text(productName, margin + 3, currentY + 5);
  pdf.text(`${order.liters} ${t.liters}`, margin + 80, currentY + 5);
  // FIXED: Changed from .toFixed(3) to .toFixed(2) for proper currency formatting
  pdf.text(`${getCurrencySymbol(order.currency || 'EUR')}${order.price_per_liter.toFixed(2)}`, margin + 115, currentY + 5);
  pdf.text(`${getCurrencySymbol(order.currency || 'EUR')}${(order.liters * order.price_per_liter).toFixed(2)}`, margin + 150, currentY + 5);
  
  currentY += 8;

  // Delivery fee if applicable (white background)
  if (order.delivery_fee > 0) {
    pdf.text(t.deliveryFee, margin + 3, currentY + 5);
    pdf.text('1', margin + 80, currentY + 5);
    pdf.text(`${getCurrencySymbol(order.currency || 'EUR')}${order.delivery_fee.toFixed(2)}`, margin + 115, currentY + 5);
    pdf.text(`${getCurrencySymbol(order.currency || 'EUR')}${order.delivery_fee.toFixed(2)}`, margin + 150, currentY + 5);
    currentY += 8;
  }

  currentY += 10; // Space after table

  // TOTALS section - matching template design
  const totalsStartX = margin + 106; // Align to right side
  const totalsWidth = 64;
  
  // Background for totals
  pdf.setFillColor(248, 248, 248);
  pdf.rect(totalsStartX, currentY, totalsWidth, 24, 'F');
  
  // Add border
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(totalsStartX, currentY, totalsWidth, 24);
  
  // Calculate totals
  const vatRate = order.shops?.vat_rate || 19;
  const totalAmount = order.total_amount;
  const totalWithoutVat = totalAmount / (1 + vatRate / 100);
  const vatAmount = totalAmount - totalWithoutVat;
  
  // Totals text
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.setFont(getPDFFont(language), 'normal');
  
  let totalsY = currentY + 5;
  pdf.text(`${t.subtotal}:`, totalsStartX + 3, totalsY);
  pdf.text(`${getCurrencySymbol(order.currency || 'EUR')}${totalWithoutVat.toFixed(2)}`, totalsStartX + totalsWidth - 3, totalsY, { align: 'right' });
  totalsY += 4;
  
  pdf.text(`${t.vat} (${vatRate}%):`, totalsStartX + 3, totalsY);
  pdf.text(`${getCurrencySymbol(order.currency || 'EUR')}${vatAmount.toFixed(2)}`, totalsStartX + totalsWidth - 3, totalsY, { align: 'right' });
  totalsY += 5;
  
  // Add separator line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(totalsStartX + 3, totalsY - 1, totalsStartX + totalsWidth - 3, totalsY - 1);
  
  // Grand total
  pdf.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
  pdf.setFontSize(12);
  pdf.setFont(getPDFFont(language), 'bold');
  pdf.text(`${t.grandTotal || t.totalAmount}:`, totalsStartX + 3, totalsY + 3);
  pdf.text(`${getCurrencySymbol(order.currency || 'EUR')}${totalAmount.toFixed(2)}`, totalsStartX + totalsWidth - 3, totalsY + 3, { align: 'right' });

  currentY += 35; // Space after totals

  // PAYMENT DETAILS CARD - matching template with dynamic label width
  if (bankData) {
    // Card header
    pdf.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
    pdf.rect(margin, currentY, tableWidth, 12, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont(getPDFFont(language), 'bold');
    pdf.text(t.paymentDetails, margin + 3, currentY + 8);
    
    // Card content
    const cardContentY = currentY + 12;
    pdf.setFillColor(248, 248, 248);
    pdf.rect(margin, cardContentY, tableWidth, 24, 'F');
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont(getPDFFont(language), 'normal');
    
    // Calculate dynamic label width for payment details
    const paymentLabels = [
      t.accountHolder,
      t.iban,
      t.bic || 'BIC',
      t.paymentReference
    ];
    const paymentLabelWidth = calculateLabelWidth(pdf, paymentLabels, 10, language);
    
    let paymentY = cardContentY + 6;
    
    pdf.setFont(getPDFFont(language), 'bold');
    pdf.text(`${t.accountHolder}:`, margin + 3, paymentY);
    pdf.setFont(getPDFFont(language), 'normal');
    const shopName = (order.shops?.name || 'Heizöl-Service').trim();
    const accountHolder = bankData.use_anyname ? shopName : bankData.account_holder;
    pdf.text(accountHolder || '', margin + 3 + paymentLabelWidth, paymentY);
    paymentY += 4;
    
    pdf.setFont(getPDFFont(language), 'bold');
    pdf.text(`${t.iban}:`, margin + 3, paymentY);
    pdf.setFont(getPDFFont(language), 'normal');
    pdf.text(formatIBAN(bankData.iban || ''), margin + 3 + paymentLabelWidth, paymentY);
    paymentY += 4;
    
    if (bankData.bic) {
      pdf.setFont(getPDFFont(language), 'bold');
      pdf.text(`${t.bic}:`, margin + 3, paymentY);
      pdf.setFont(getPDFFont(language), 'normal');
      pdf.text(bankData.bic, margin + 3 + paymentLabelWidth, paymentY);
      paymentY += 4;
    }
    
    pdf.setFont(getPDFFont(language), 'bold');
    pdf.text(`${t.paymentReference}:`, margin + 3, paymentY);
    pdf.setFont(getPDFFont(language), 'normal');
    pdf.text(orderNumberForInvoice, margin + 3 + paymentLabelWidth, paymentY);
    
    currentY += 37; // Move past payment card
    
    // Add deposit note if provided
    if (depositNote) {
      currentY += 5; // Small spacing
      
      // Deposit note box
      pdf.setFillColor(255, 248, 220); // Light yellow background
      pdf.rect(margin, currentY, tableWidth, 16, 'F');
      
      // Deposit note border
      pdf.setDrawColor(255, 193, 7); // Yellow border
      pdf.rect(margin, currentY, tableWidth, 16);
      
      pdf.setTextColor(133, 77, 14); // Dark yellow text
      pdf.setFontSize(10);
      pdf.setFont(getPDFFont(language), 'bold');
      pdf.text('Zahlungshinweis:', margin + 3, currentY + 6);
      
      pdf.setFont(getPDFFont(language), 'normal');
      // Split text to fit within the box
      const maxWidth = tableWidth - 6;
      const lines = pdf.splitTextToSize(depositNote, maxWidth);
      let depositY = currentY + 11;
      
      lines.forEach((line: string) => {
        if (depositY < currentY + 16) { // Ensure we don't overflow the box
          pdf.text(line, margin + 3, depositY);
          depositY += 4;
        }
      });
      
      currentY += 16; // Move past deposit note
    }
  }

  currentY += 15; // Extra space before footer

  // MODERN 4-COLUMN FOOTER with dynamic column widths
  const footerStartY = Math.max(currentY, pageHeight - 40); // Ensure footer is near bottom
  
  // Footer background
  pdf.setFillColor(248, 248, 248);
  pdf.rect(0, footerStartY, pageWidth, pageHeight - footerStartY, 'F');
  
  // Calculate dynamic column widths
  const columnWidths = calculateFooterColumnWidths(pdf, t, pageWidth, margin, language);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(8);
  
  let footerY = footerStartY + 8;
  
  // Column 1: Company name and address
  pdf.setFont(getPDFFont(language), 'bold');
  pdf.text(order.shops?.company_name || '', margin, footerY);
  pdf.setFont(getPDFFont(language), 'normal');
  footerY += 4;
  pdf.text(order.shops?.company_address || '', margin, footerY);
  footerY += 3;
  pdf.text(`${order.shops?.company_postcode || ''} ${order.shops?.company_city || ''}`, margin, footerY);
  
  // Column 2: Contact information
  footerY = footerStartY + 8;
  pdf.setFont(getPDFFont(language), 'bold');
  pdf.text(t.contact, margin + columnWidths[0], footerY);
  pdf.setFont(getPDFFont(language), 'normal');
  footerY += 4;
  if (order.shops?.company_phone) {
    pdf.text(order.shops.company_phone, margin + columnWidths[0], footerY);
    footerY += 3;
  }
  pdf.text(order.shops?.company_email || '', margin + columnWidths[0], footerY);
  footerY += 3;
  if (order.shops?.company_website) {
    pdf.text(order.shops.company_website, margin + columnWidths[0], footerY);
  }
  
  // Column 3: Bank information
  footerY = footerStartY + 8;
  pdf.setFont(getPDFFont(language), 'bold');
  pdf.text(t.bankInformation, margin + columnWidths[0] + columnWidths[1], footerY);
  if (bankData) {
    pdf.setFont(getPDFFont(language), 'normal');
    footerY += 4;
    const footerAccountHolder = bankData.use_anyname ? order.shops?.company_name : bankData.account_holder;
    pdf.text(footerAccountHolder || '', margin + columnWidths[0] + columnWidths[1], footerY);
    footerY += 3;
    pdf.text(formatIBAN(bankData.iban || ''), margin + columnWidths[0] + columnWidths[1], footerY);
    if (bankData.bic) {
      footerY += 3;
      pdf.text(bankData.bic, margin + columnWidths[0] + columnWidths[1], footerY);
    }
  }
  
  // Column 4: Business owner and VAT ID
  footerY = footerStartY + 8;
  pdf.setFont(getPDFFont(language), 'bold');
  pdf.text(t.businessData, margin + columnWidths[0] + columnWidths[1] + columnWidths[2], footerY);
  pdf.setFont(getPDFFont(language), 'normal');
  footerY += 4;
  if (order.shops?.business_owner) {
    pdf.text(order.shops.business_owner, margin + columnWidths[0] + columnWidths[1] + columnWidths[2], footerY);
    footerY += 3;
  }
  if (order.shops?.vat_number) {
    pdf.text(order.shops.vat_number, margin + columnWidths[0] + columnWidths[1] + columnWidths[2], footerY);
  }

  console.log('PDF generation completed, matching InvoicePreview template layout with dynamic text placement');
  
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
    const { order_id, language, deposit_note, deposit_percentage }: GenerateInvoiceRequest = await req.json();
    console.log('Starting invoice generation for order:', order_id);
    console.log('Requested language:', language);
    console.log('Deposit options:', { deposit_note, deposit_percentage });

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
          bank_account_id,
          accent_color,
          company_phone,
          company_website,
          business_owner,
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
    console.log('Generating PDF with filename:', filename);

    // Generate PDF
    const pdfBuffer = await generateResponsivePDF(order, bankData, finalLanguage, deposit_note);
    console.log('PDF generated successfully, size:', pdfBuffer.byteLength, 'bytes');

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
