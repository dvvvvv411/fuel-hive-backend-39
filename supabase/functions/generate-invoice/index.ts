
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  order_id: string;
  language?: string;
}

// Import translations directly in the edge function
const translations = {
  de: {
    invoice: 'Rechnung',
    invoiceNumber: 'Rechnungsnummer',
    invoiceDate: 'Rechnungsdatum',
    dueDate: 'Fälligkeitsdatum',
    orderNumber: 'Bestellnummer',
    orderDate: 'Bestelldatum',
    description: 'Beschreibung',
    quantity: 'Menge',
    unitPrice: 'Einzelpreis',
    total: 'Gesamt',
    subtotal: 'Zwischensumme',
    vat: 'MwSt',
    grandTotal: 'Gesamtbetrag',
    paymentDetails: 'Zahlungsdetails',
    accountHolder: 'Kontoinhaber',
    iban: 'IBAN',
    bic: 'BIC',
    paymentReference: 'Verwendungszweck',
    thankYou: 'Vielen Dank für Ihren Auftrag!',
    heatingOilDelivery: 'Heizöllieferung',
    liters: 'Liter',
    deliveryFee: 'Liefergebühr',
    dueDays: '14 Tage',
    currency: '€',
    deliveryAddress: 'Lieferadresse',
    billingAddress: 'Rechnungsadresse',
    paymentTerm: 'Zahlungsziel',
    website: 'Website',
    phone: 'Telefon',
    email: 'E-Mail'
  },
  en: {
    invoice: 'Invoice',
    invoiceNumber: 'Invoice Number',
    invoiceDate: 'Invoice Date',
    dueDate: 'Due Date',
    orderNumber: 'Order Number',
    orderDate: 'Order Date',
    description: 'Description',
    quantity: 'Quantity',
    unitPrice: 'Unit Price',
    total: 'Total',
    subtotal: 'Subtotal',
    vat: 'VAT',
    grandTotal: 'Grand Total',
    paymentDetails: 'Payment Details',
    accountHolder: 'Account Holder',
    iban: 'IBAN',
    bic: 'BIC',
    paymentReference: 'Payment Reference',
    thankYou: 'Thank you for your order!',
    heatingOilDelivery: 'Heating Oil Delivery',
    liters: 'Liters',
    deliveryFee: 'Delivery Fee',
    dueDays: '14 days',
    currency: '€',
    deliveryAddress: 'Delivery Address',
    billingAddress: 'Billing Address',
    paymentTerm: 'Payment Term',
    website: 'Website',
    phone: 'Phone',
    email: 'Email'
  },
  fr: {
    invoice: 'Facture',
    invoiceNumber: 'Numéro de facture',
    invoiceDate: 'Date de facture',
    dueDate: 'Date d\'échéance',
    orderNumber: 'Numéro de commande',
    orderDate: 'Date de commande',
    description: 'Description',
    quantity: 'Quantité',
    unitPrice: 'Prix unitaire',
    total: 'Total',
    subtotal: 'Sous-total',
    vat: 'TVA',
    grandTotal: 'Total général',
    paymentDetails: 'Détails de paiement',
    accountHolder: 'Titulaire du compte',
    iban: 'IBAN',
    bic: 'BIC',
    paymentReference: 'Référence de paiement',
    thankYou: 'Merci pour votre commande!',
    heatingOilDelivery: 'Livraison de fioul',
    liters: 'Litres',
    deliveryFee: 'Frais de livraison',
    dueDays: '14 jours',
    currency: '€',
    deliveryAddress: 'Adresse de livraison',
    billingAddress: 'Adresse de facturation',
    paymentTerm: 'Terme de paiement',
    website: 'Site web',
    phone: 'Téléphone',
    email: 'Email'
  },
  es: {
    invoice: 'Factura',
    invoiceNumber: 'Número de factura',
    invoiceDate: 'Fecha de factura',
    dueDate: 'Fecha de vencimiento',
    orderNumber: 'Número de pedido',
    orderDate: 'Fecha de pedido',
    description: 'Descripción',
    quantity: 'Cantidad',
    unitPrice: 'Precio unitario',
    total: 'Total',
    subtotal: 'Subtotal',
    vat: 'IVA',
    grandTotal: 'Total general',
    paymentDetails: 'Detalles de pago',
    accountHolder: 'Titular de la cuenta',
    iban: 'IBAN',
    bic: 'BIC',
    paymentReference: 'Referencia de pago',
    thankYou: '¡Gracias por su pedido!',
    heatingOilDelivery: 'Entrega de combustible',
    liters: 'Litros',
    deliveryFee: 'Tarifa de entrega',
    dueDays: '14 días',
    currency: '€',
    deliveryAddress: 'Dirección de entrega',
    billingAddress: 'Dirección de facturación',
    paymentTerm: 'Término de pago',
    website: 'Sitio web',
    phone: 'Teléfono',
    email: 'Email'
  },
  it: {
    invoice: 'Fattura',
    invoiceNumber: 'Numero fattura',
    invoiceDate: 'Data fattura',
    dueDate: 'Data di scadenza',
    orderNumber: 'Numero ordine',
    orderDate: 'Data ordine',
    description: 'Descrizione',
    quantity: 'Quantità',
    unitPrice: 'Prezzo unitario',
    total: 'Totale',
    subtotal: 'Subtotale',
    vat: 'IVA',
    grandTotal: 'Totale generale',
    paymentDetails: 'Dettagli pagamento',
    accountHolder: 'Intestatario conto',
    iban: 'IBAN',
    bic: 'BIC',
    paymentReference: 'Riferimento pagamento',
    thankYou: 'Grazie per il tuo ordine!',
    heatingOilDelivery: 'Consegna gasolio',
    liters: 'Litri',
    deliveryFee: 'Tassa di consegna',
    dueDays: '14 giorni',
    currency: '€',
    deliveryAddress: 'Indirizzo di consegna',
    billingAddress: 'Indirizzo di fatturazione',
    paymentTerm: 'Termine di pagamento',
    website: 'Sito web',
    phone: 'Telefono',
    email: 'Email'
  },
  nl: {
    invoice: 'Factuur',
    invoiceNumber: 'Factuurnummer',
    invoiceDate: 'Factuurdatum',
    dueDate: 'Vervaldatum',
    orderNumber: 'Bestelnummer',
    orderDate: 'Besteldatum',
    description: 'Beschrijving',
    quantity: 'Hoeveelheid',
    unitPrice: 'Eenheidsprijs',
    total: 'Totaal',
    subtotal: 'Subtotaal',
    vat: 'BTW',
    grandTotal: 'Eindtotaal',
    paymentDetails: 'Betalingsgegevens',
    accountHolder: 'Rekeninghouder',
    iban: 'IBAN',
    bic: 'BIC',
    paymentReference: 'Betalingskenmerk',
    thankYou: 'Dank u voor uw bestelling!',
    heatingOilDelivery: 'Stookolielevering',
    liters: 'Liters',
    deliveryFee: 'Leveringskosten',
    dueDays: '14 dagen',
    currency: '€',
    deliveryAddress: 'Leveringsadres',
    billingAddress: 'Factuuradres',
    paymentTerm: 'Betalingstermijn',
    website: 'Website',
    phone: 'Telefoon',
    email: 'E-mail'
  },
  pt: {
    invoice: 'Fatura',
    invoiceNumber: 'Número da fatura',
    invoiceDate: 'Data da fatura',
    dueDate: 'Data de vencimento',
    orderNumber: 'Número do pedido',
    orderDate: 'Data do pedido',
    description: 'Descrição',
    quantity: 'Quantidade',
    unitPrice: 'Preço unitário',
    total: 'Total',
    subtotal: 'Subtotal',
    vat: 'IVA',
    grandTotal: 'Total geral',
    paymentDetails: 'Detalhes de pagamento',
    accountHolder: 'Titular da conta',
    iban: 'IBAN',
    bic: 'BIC',
    paymentReference: 'Referência de pagamento',
    thankYou: 'Obrigado pelo seu pedido!',
    heatingOilDelivery: 'Entrega de óleo de aquecimento',
    liters: 'Litros',
    deliveryFee: 'Taxa de entrega',
    dueDays: '14 dias',
    currency: '€',
    deliveryAddress: 'Endereço de entrega',
    billingAddress: 'Endereço de faturação',
    paymentTerm: 'Prazo de pagamento',
    website: 'Website',
    phone: 'Telefone',
    email: 'Email'
  },
  pl: {
    invoice: 'Faktura',
    invoiceNumber: 'Numer faktury',
    invoiceDate: 'Data faktury',
    dueDate: 'Termin płatności',
    orderNumber: 'Numer zamówienia',
    orderDate: 'Data zamówienia',
    description: 'Opis',
    quantity: 'Ilość',
    unitPrice: 'Cena jednostkowa',
    total: 'Razem',
    subtotal: 'Suma częściowa',
    vat: 'VAT',
    grandTotal: 'Suma całkowita',
    paymentDetails: 'Szczegóły płatności',
    accountHolder: 'Właściciel konta',
    iban: 'IBAN',
    bic: 'BIC',
    paymentReference: 'Tytuł płatności',
    thankYou: 'Dziękujemy za zamówienie!',
    heatingOilDelivery: 'Dostawa oleju opałowego',
    liters: 'Litry',
    deliveryFee: 'Opłata za dostawę',
    dueDays: '14 dni',
    currency: '€',
    deliveryAddress: 'Adres dostawy',
    billingAddress: 'Adres rozliczeniowy',
    paymentTerm: 'Termin płatności',
    website: 'Strona internetowa',
    phone: 'Telefon',
    email: 'Email'
  },
  sv: {
    invoice: 'Faktura',
    invoiceNumber: 'Fakturanummer',
    invoiceDate: 'Fakturadatum',
    dueDate: 'Förfallodatum',
    orderNumber: 'Ordernummer',
    orderDate: 'Orderdatum',
    description: 'Beskrivning',
    quantity: 'Kvantitet',
    unitPrice: 'Enhetspris',
    total: 'Total',
    subtotal: 'Delsumma',
    vat: 'Moms',
    grandTotal: 'Totalsumma',
    paymentDetails: 'Betalningsuppgifter',
    accountHolder: 'Kontoinnehavare',
    iban: 'IBAN',
    bic: 'BIC',
    paymentReference: 'Betalningsreferens',
    thankYou: 'Tack för din beställning!',
    heatingOilDelivery: 'Leverans av eldningsolja',
    liters: 'Liter',
    deliveryFee: 'Leveransavgift',
    dueDays: '14 dagar',
    currency: '€',
    deliveryAddress: 'Leveransadress',
    billingAddress: 'Faktureringsadress',
    paymentTerm: 'Betalningsvillkor',
    website: 'Webbplats',
    phone: 'Telefon',
    email: 'E-post'
  },
  da: {
    invoice: 'Faktura',
    invoiceNumber: 'Fakturanummer',
    invoiceDate: 'Fakturadato',
    dueDate: 'Forfaldsdato',
    orderNumber: 'Ordrenummer',
    orderDate: 'Ordredato',
    description: 'Beskrivelse',
    quantity: 'Mængde',
    unitPrice: 'Enhedspris',
    total: 'Total',
    subtotal: 'Subtotal',
    vat: 'Moms',
    grandTotal: 'Samlet total',
    paymentDetails: 'Betalingsoplysninger',
    accountHolder: 'Kontoindehaver',
    iban: 'IBAN',
    bic: 'BIC',
    paymentReference: 'Betalingsreference',
    thankYou: 'Tak for din ordre!',
    heatingOilDelivery: 'Levering af fyringsolie',
    liters: 'Liter',
    deliveryFee: 'Leveringsgebyr',
    dueDays: '14 dage',
    currency: '€',
    deliveryAddress: 'Leveringsadresse',
    billingAddress: 'Faktureringsadresse',
    paymentTerm: 'Betalingsbetingelser',
    website: 'Hjemmeside',
    phone: 'Telefon',
    email: 'Email'
  },
  no: {
    invoice: 'Faktura',
    invoiceNumber: 'Fakturanummer',
    invoiceDate: 'Fakturadato',
    dueDate: 'Forfallsdato',
    orderNumber: 'Ordrenummer',
    orderDate: 'Ordredato',
    description: 'Beskrivelse',
    quantity: 'Mengde',
    unitPrice: 'Enhetspris',
    total: 'Total',
    subtotal: 'Delsum',
    vat: 'MVA',
    grandTotal: 'Totalsum',
    paymentDetails: 'Betalingsdetaljer',
    accountHolder: 'Kontoinnehaver',
    iban: 'IBAN',
    bic: 'BIC',
    paymentReference: 'Betalingsreferanse',
    thankYou: 'Takk for din ordre!',
    heatingOilDelivery: 'Levering av fyringsolje',
    liters: 'Liter',
    deliveryFee: 'Leveringsgebyr',
    dueDays: '14 dager',
    currency: '€',
    deliveryAddress: 'Leveringsadresse',
    billingAddress: 'Faktureringsadresse',
    paymentTerm: 'Betalingsbetingelser',
    website: 'Nettside',
    phone: 'Telefon',
    email: 'E-post'
  },
  fi: {
    invoice: 'Lasku',
    invoiceNumber: 'Laskunumero',
    invoiceDate: 'Laskupäivä',
    dueDate: 'Eräpäivä',
    orderNumber: 'Tilausnumero',
    orderDate: 'Tilauspäivä',
    description: 'Kuvaus',
    quantity: 'Määrä',
    unitPrice: 'Yksikköhinta',
    total: 'Yhteensä',
    subtotal: 'Välisumma',
    vat: 'ALV',
    grandTotal: 'Loppusumma',
    paymentDetails: 'Maksutiedot',
    accountHolder: 'Tilinomistaja',
    iban: 'IBAN',
    bic: 'BIC',
    paymentReference: 'Maksuviite',
    thankYou: 'Kiitos tilauksestasi!',
    heatingOilDelivery: 'Lämmitysöljyn toimitus',
    liters: 'Litraa',
    deliveryFee: 'Toimitusmaksu',
    dueDays: '14 päivää',
    currency: '€',
    deliveryAddress: 'Toimitusosoite',
    billingAddress: 'Laskutusosoite',
    paymentTerm: 'Maksuehto',
    website: 'Verkkosivu',
    phone: 'Puhelin',
    email: 'Sähköposti'
  }
};

function getInvoiceTranslations(language: string) {
  return translations[language as keyof typeof translations] || translations.de;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// LAYOUT CONSTANTS - Fixed grid system for consistent layout across all languages
const LAYOUT = {
  // Page dimensions (A4)
  PAGE_WIDTH: 210,
  PAGE_HEIGHT: 297,
  MARGIN: 20,
  
  // Header section
  HEADER: {
    HEIGHT: 52, // Fixed height for header section
    LOGO_WIDTH: 40,
    LOGO_HEIGHT: 32,
    COMPANY_START_X_OFFSET: 46, // LOGO_WIDTH + 6mm spacing
    TITLE_Y_OFFSET: 20 // Space after header for title
  },
  
  // Content sections with fixed positions
  SECTIONS: {
    TITLE_Y: 84, // MARGIN + HEADER.HEIGHT + TITLE_Y_OFFSET
    ADDRESS_Y: 110,
    ADDRESS_HEIGHT: 60, // Fixed height for address section
    INVOICE_DETAILS_Y: 110,
    INVOICE_DETAILS_HEIGHT: 40,
    TABLE_Y: 180, // Fixed position for table start
    TABLE_HEADER_HEIGHT: 10,
    TABLE_ROW_HEIGHT: 8,
    TOTALS_Y_OFFSET: 20, // Space after table
    PAYMENT_Y_OFFSET: 25, // Space after totals
    FOOTER_Y: 262 // Fixed footer position
  },
  
  // Typography - responsive sizing
  FONT_SIZES: {
    TITLE: 28,
    SECTION_HEADER: 12,
    NORMAL: 10,
    SMALL: 9,
    FOOTER: 8
  },
  
  // Colors
  COLORS: {
    PRIMARY_TEXT: [0, 0, 0],
    SECONDARY_TEXT: [80, 80, 80],
    LIGHT_TEXT: [120, 120, 120],
    BACKGROUND_LIGHT: [250, 250, 250],
    BACKGROUND_GRAY: [248, 249, 250],
    BORDER_LIGHT: [220, 220, 220]
  }
};

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 37, g: 99, b: 235 }; // Default blue
}

// Helper function to fetch and convert logo to base64 with standardized dimensions
async function fetchLogoAsBase64(logoUrl: string): Promise<string | null> {
  try {
    console.log('Fetching logo from URL:', logoUrl);
    
    const response = await fetch(logoUrl);
    if (!response.ok) {
      console.error('Failed to fetch logo:', response.status, response.statusText);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      console.error('URL does not point to an image:', contentType);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    
    console.log('Logo converted to base64, size:', base64.length, 'characters');
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Error fetching logo:', error);
    return null;
  }
}

// Helper function to truncate text to fit within specified width
function truncateText(doc: any, text: string, maxWidth: number, fontSize: number): string {
  doc.setFontSize(fontSize);
  const textWidth = doc.getTextWidth(text);
  
  if (textWidth <= maxWidth) {
    return text;
  }
  
  // Binary search for the best fit
  let left = 0;
  let right = text.length;
  let bestFit = '';
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const truncated = text.substring(0, mid) + (mid < text.length ? '...' : '');
    const truncatedWidth = doc.getTextWidth(truncated);
    
    if (truncatedWidth <= maxWidth) {
      bestFit = truncated;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return bestFit || text.substring(0, 1) + '...';
}

// Helper function to render standardized logo
function renderLogo(doc: any, logoBase64: string | null, x: number, y: number, accentColor: { r: number; g: number; b: number }): void {
  if (logoBase64) {
    try {
      console.log('Adding standardized logo to PDF');
      // Always use exact dimensions regardless of original image proportions
      doc.addImage(logoBase64, 'JPEG', x, y, LAYOUT.HEADER.LOGO_WIDTH, LAYOUT.HEADER.LOGO_HEIGHT);
    } catch (logoError) {
      console.warn('Error adding logo to PDF, using placeholder:', logoError);
      renderLogoPlaceholder(doc, x, y, accentColor);
    }
  } else {
    renderLogoPlaceholder(doc, x, y, accentColor);
  }
}

// Helper function to render standardized logo placeholder
function renderLogoPlaceholder(doc: any, x: number, y: number, accentColor: { r: number; g: number; b: number }): void {
  console.log('Using standardized logo placeholder');
  
  // Background
  doc.setFillColor(...LAYOUT.COLORS.BACKGROUND_LIGHT);
  doc.rect(x, y, LAYOUT.HEADER.LOGO_WIDTH, LAYOUT.HEADER.LOGO_HEIGHT, 'F');
  
  // Border
  doc.setDrawColor(...LAYOUT.COLORS.BORDER_LIGHT);
  doc.setLineWidth(0.5);
  doc.rect(x, y, LAYOUT.HEADER.LOGO_WIDTH, LAYOUT.HEADER.LOGO_HEIGHT);
  
  // Text
  doc.setFontSize(LAYOUT.FONT_SIZES.SMALL);
  doc.setTextColor(...LAYOUT.COLORS.LIGHT_TEXT);
  doc.text('LOGO', x + LAYOUT.HEADER.LOGO_WIDTH/2, y + LAYOUT.HEADER.LOGO_HEIGHT/2, { align: 'center' });
}

const serve_handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { order_id, language: requestLanguage }: RequestBody = await req.json();

    console.log('Starting invoice generation for order:', order_id);
    console.log('Requested language:', requestLanguage);

    // Fetch order details with shop information
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
          accent_color,
          support_phone,
          bank_account_id,
          bank_accounts(
            account_name,
            account_holder,
            iban,
            bic,
            bank_name,
            use_anyname
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

    // Use requested language, fallback to shop language, then to 'de'
    const finalLanguage = requestLanguage || order.shops.language || 'de';
    console.log('Final language for PDF:', finalLanguage);

    // Get translations based on final language
    const t = getInvoiceTranslations(finalLanguage);
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
    const filename = `${t.invoice.toLowerCase()}_${invoiceNumber.replace('/', '_')}_${finalLanguage}.pdf`;

    console.log('Generating PDF with filename:', filename);

    // Generate PDF content with standardized layout
    const pdfContent = await generateStandardizedInvoicePDF(order, invoiceNumber, t, currencySymbol, finalLanguage);

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
        language: finalLanguage,
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

async function generateStandardizedInvoicePDF(order: any, invoiceNumber: string, t: any, currencySymbol: string, language: string): Promise<Uint8Array> {
  try {
    console.log('Starting standardized PDF generation with language:', language);
    
    // Import jsPDF dynamically
    const { jsPDF } = await import("https://esm.sh/jspdf@2.5.1");
    
    // Create new PDF document with fixed layout constants
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const contentWidth = LAYOUT.PAGE_WIDTH - (2 * LAYOUT.MARGIN);
    
    // Get accent color from shop settings
    const accentColor = order.shops.accent_color || '#2563eb';
    const rgb = hexToRgb(accentColor);
    
    // Calculate VAT details
    const vatRate = order.shops.vat_rate || 19;
    const totalWithoutVat = order.total_amount / (1 + vatRate / 100);
    const vatAmount = order.total_amount - totalWithoutVat;
    
    // Check if delivery and billing addresses are different
    const hasDifferentAddresses = 
      order.billing_street && 
      (order.billing_street !== order.delivery_street ||
       order.billing_postcode !== order.delivery_postcode ||
       order.billing_city !== order.delivery_city);
    
    // Set font encoding to support special characters
    doc.setFont("helvetica", "normal");
    
    // HEADER SECTION - Fixed layout regardless of content length
    let logoBase64 = null;
    
    // Fetch logo with cache busting
    if (order.shops.logo_url) {
      console.log('Attempting to fetch logo from:', order.shops.logo_url);
      const cacheBustedUrl = `${order.shops.logo_url}?v=${Date.now()}`;
      logoBase64 = await fetchLogoAsBase64(cacheBustedUrl);
    }
    
    // Render standardized logo
    renderLogo(doc, logoBase64, LAYOUT.MARGIN, LAYOUT.MARGIN, rgb);
    
    // Company details - fixed position and responsive text
    const companyStartX = LAYOUT.MARGIN + LAYOUT.HEADER.COMPANY_START_X_OFFSET;
    const maxCompanyWidth = contentWidth - LAYOUT.HEADER.COMPANY_START_X_OFFSET;
    
    doc.setFontSize(20);
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    const companyName = truncateText(doc, order.shops.company_name, maxCompanyWidth, 20);
    doc.text(companyName, companyStartX, LAYOUT.MARGIN + 10);
    
    let companyY = LAYOUT.MARGIN + 15;
    doc.setFontSize(LAYOUT.FONT_SIZES.SMALL);
    doc.setTextColor(...LAYOUT.COLORS.SECONDARY_TEXT);
    
    const companyAddress = truncateText(doc, order.shops.company_address, maxCompanyWidth, LAYOUT.FONT_SIZES.SMALL);
    doc.text(companyAddress, companyStartX, companyY);
    companyY += 4;
    
    const cityPostcode = truncateText(doc, `${order.shops.company_postcode} ${order.shops.company_city}`, maxCompanyWidth, LAYOUT.FONT_SIZES.SMALL);
    doc.text(cityPostcode, companyStartX, companyY);
    companyY += 4;
    
    if (order.shops.company_phone) {
      const phone = truncateText(doc, `${t.phone}: ${order.shops.company_phone}`, maxCompanyWidth, LAYOUT.FONT_SIZES.SMALL);
      doc.text(phone, companyStartX, companyY);
      companyY += 4;
    }
    
    const email = truncateText(doc, `${t.email}: ${order.shops.company_email}`, maxCompanyWidth, LAYOUT.FONT_SIZES.SMALL);
    doc.text(email, companyStartX, companyY);
    companyY += 4;
    
    if (order.shops.company_website) {
      const website = truncateText(doc, `${t.website}: ${order.shops.company_website}`, maxCompanyWidth, LAYOUT.FONT_SIZES.SMALL);
      doc.text(website, companyStartX, companyY);
      companyY += 4;
    }
    
    if (order.shops.vat_number) {
      const vat = truncateText(doc, `USt-IdNr: ${order.shops.vat_number}`, maxCompanyWidth, LAYOUT.FONT_SIZES.SMALL);
      doc.text(vat, companyStartX, companyY);
    }
    
    // INVOICE TITLE - Fixed position
    doc.setFontSize(LAYOUT.FONT_SIZES.TITLE);
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text(t.invoice, LAYOUT.MARGIN, LAYOUT.SECTIONS.TITLE_Y);
    
    // TWO-COLUMN LAYOUT - Fixed positions
    const leftColumnX = LAYOUT.MARGIN;
    const rightColumnX = LAYOUT.MARGIN + (contentWidth * 0.55);
    
    // LEFT COLUMN - Address(es) - Fixed height allocation
    let addressY = LAYOUT.SECTIONS.ADDRESS_Y;
    
    // Billing Address (or single address if same)
    if (hasDifferentAddresses) {
      doc.setFontSize(LAYOUT.FONT_SIZES.SECTION_HEADER);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      doc.text(t.billingAddress, leftColumnX, addressY);
      addressY += 8;
    }
    
    doc.setFontSize(LAYOUT.FONT_SIZES.NORMAL);
    doc.setTextColor(...LAYOUT.COLORS.PRIMARY_TEXT);
    
    const customerName = truncateText(doc, order.customer_name, contentWidth * 0.45, LAYOUT.FONT_SIZES.NORMAL);
    doc.text(customerName, leftColumnX, addressY);
    addressY += 5;
    
    const billingStreet = order.billing_street || order.delivery_street;
    const billingPostcode = order.billing_postcode || order.delivery_postcode;
    const billingCity = order.billing_city || order.delivery_city;
    
    const street = truncateText(doc, billingStreet, contentWidth * 0.45, LAYOUT.FONT_SIZES.NORMAL);
    doc.text(street, leftColumnX, addressY);
    addressY += 5;
    
    const cityLine = truncateText(doc, `${billingPostcode} ${billingCity}`, contentWidth * 0.45, LAYOUT.FONT_SIZES.NORMAL);
    doc.text(cityLine, leftColumnX, addressY);
    addressY += 10;
    
    // Delivery Address (if different) - within fixed height
    if (hasDifferentAddresses && addressY < LAYOUT.SECTIONS.ADDRESS_Y + LAYOUT.SECTIONS.ADDRESS_HEIGHT - 20) {
      doc.setFontSize(LAYOUT.FONT_SIZES.SECTION_HEADER);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      doc.text(t.deliveryAddress, leftColumnX, addressY);
      addressY += 8;
      
      doc.setFontSize(LAYOUT.FONT_SIZES.NORMAL);
      doc.setTextColor(...LAYOUT.COLORS.PRIMARY_TEXT);
      
      const deliveryName = truncateText(doc, `${order.delivery_first_name} ${order.delivery_last_name}`, contentWidth * 0.45, LAYOUT.FONT_SIZES.NORMAL);
      doc.text(deliveryName, leftColumnX, addressY);
      addressY += 5;
      
      const deliveryStreet = truncateText(doc, order.delivery_street, contentWidth * 0.45, LAYOUT.FONT_SIZES.NORMAL);
      doc.text(deliveryStreet, leftColumnX, addressY);
      addressY += 5;
      
      const deliveryCity = truncateText(doc, `${order.delivery_postcode} ${order.delivery_city}`, contentWidth * 0.45, LAYOUT.FONT_SIZES.NORMAL);
      doc.text(deliveryCity, leftColumnX, addressY);
    }
    
    // RIGHT COLUMN - Invoice Details - Fixed position and height
    let detailsY = LAYOUT.SECTIONS.INVOICE_DETAILS_Y;
    doc.setFontSize(LAYOUT.FONT_SIZES.NORMAL);
    doc.setTextColor(...LAYOUT.COLORS.PRIMARY_TEXT);
    
    const labelWidth = 35;
    const valueX = rightColumnX + labelWidth;
    const maxValueWidth = contentWidth * 0.45 - labelWidth;
    
    doc.text(`${t.invoiceDate}:`, rightColumnX, detailsY);
    doc.text(new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE'), valueX, detailsY);
    detailsY += 6;
    
    doc.text(`${t.orderNumber}:`, rightColumnX, detailsY);
    const orderNum = truncateText(doc, order.order_number, maxValueWidth, LAYOUT.FONT_SIZES.NORMAL);
    doc.text(orderNum, valueX, detailsY);
    detailsY += 6;
    
    doc.text(`${t.orderDate}:`, rightColumnX, detailsY);
    doc.text(new Date(order.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE'), valueX, detailsY);
    
    // ITEMS TABLE - Fixed position
    const tableStartY = LAYOUT.SECTIONS.TABLE_Y;
    let currentY = tableStartY;
    
    // Table header with accent color
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.rect(LAYOUT.MARGIN, currentY, contentWidth, LAYOUT.SECTIONS.TABLE_HEADER_HEIGHT, 'F');
    
    doc.setFontSize(LAYOUT.FONT_SIZES.SMALL);
    doc.setTextColor(255, 255, 255);
    const headerPadding = 3;
    
    doc.text(t.description, LAYOUT.MARGIN + headerPadding, currentY + 6);
    doc.text(t.quantity, LAYOUT.MARGIN + (contentWidth * 0.5), currentY + 6);
    doc.text(t.unitPrice, LAYOUT.MARGIN + (contentWidth * 0.65), currentY + 6);
    doc.text(t.total, LAYOUT.MARGIN + (contentWidth * 0.8), currentY + 6);
    
    currentY += LAYOUT.SECTIONS.TABLE_HEADER_HEIGHT;
    
    // Table content
    doc.setTextColor(...LAYOUT.COLORS.PRIMARY_TEXT);
    doc.setFontSize(LAYOUT.FONT_SIZES.SMALL);
    
    // Main product line
    doc.setFillColor(...LAYOUT.COLORS.BACKGROUND_LIGHT);
    doc.rect(LAYOUT.MARGIN, currentY, contentWidth, LAYOUT.SECTIONS.TABLE_ROW_HEIGHT, 'F');
    
    const cellPadding = 3;
    const descriptionWidth = contentWidth * 0.45;
    const productDesc = truncateText(doc, t.heatingOilDelivery, descriptionWidth, LAYOUT.FONT_SIZES.SMALL);
    
    doc.text(productDesc, LAYOUT.MARGIN + cellPadding, currentY + 5);
    doc.text(`${order.liters} ${t.liters}`, LAYOUT.MARGIN + (contentWidth * 0.5), currentY + 5);
    doc.text(`${currencySymbol}${order.price_per_liter.toFixed(3)}`, LAYOUT.MARGIN + (contentWidth * 0.65), currentY + 5);
    doc.text(`${currencySymbol}${order.base_price.toFixed(2)}`, LAYOUT.MARGIN + (contentWidth * 0.8), currentY + 5);
    currentY += LAYOUT.SECTIONS.TABLE_ROW_HEIGHT + 2;
    
    // Delivery fee if applicable
    if (order.delivery_fee > 0) {
      const deliveryDesc = truncateText(doc, t.deliveryFee, descriptionWidth, LAYOUT.FONT_SIZES.SMALL);
      doc.text(deliveryDesc, LAYOUT.MARGIN + cellPadding, currentY + 5);
      doc.text('1', LAYOUT.MARGIN + (contentWidth * 0.5), currentY + 5);
      doc.text(`${currencySymbol}${order.delivery_fee.toFixed(2)}`, LAYOUT.MARGIN + (contentWidth * 0.65), currentY + 5);
      doc.text(`${currencySymbol}${order.delivery_fee.toFixed(2)}`, LAYOUT.MARGIN + (contentWidth * 0.8), currentY + 5);
      currentY += LAYOUT.SECTIONS.TABLE_ROW_HEIGHT + 2;
    }
    
    // Table border
    doc.setDrawColor(...LAYOUT.COLORS.BORDER_LIGHT);
    doc.setLineWidth(0.5);
    doc.rect(LAYOUT.MARGIN, tableStartY, contentWidth, currentY - tableStartY);
    
    // TOTALS SECTION - Fixed position relative to table
    const totalsY = currentY + LAYOUT.SECTIONS.TOTALS_Y_OFFSET;
    const totalsWidth = 64;
    const totalsX = LAYOUT.MARGIN + contentWidth - totalsWidth;
    
    // Totals background
    doc.setFillColor(...LAYOUT.COLORS.BACKGROUND_GRAY);
    const totalsHeight = 25;
    doc.rect(totalsX, totalsY - 5, totalsWidth, totalsHeight, 'F');
    doc.setDrawColor(...LAYOUT.COLORS.BORDER_LIGHT);
    doc.rect(totalsX, totalsY - 5, totalsWidth, totalsHeight);
    
    doc.setFontSize(LAYOUT.FONT_SIZES.NORMAL);
    doc.setTextColor(...LAYOUT.COLORS.PRIMARY_TEXT);
    
    const totalsPadding = 3;
    let totalsCurrentY = totalsY + 2;
    
    doc.text(`${t.subtotal}:`, totalsX + totalsPadding, totalsCurrentY);
    doc.text(`${currencySymbol}${totalWithoutVat.toFixed(2)}`, totalsX + totalsWidth - totalsPadding, totalsCurrentY, { align: 'right' });
    totalsCurrentY += 6;
    
    doc.text(`${t.vat} (${vatRate}%):`, totalsX + totalsPadding, totalsCurrentY);
    doc.text(`${currencySymbol}${vatAmount.toFixed(2)}`, totalsX + totalsWidth - totalsPadding, totalsCurrentY, { align: 'right' });
    totalsCurrentY += 8;
    
    // Grand total
    doc.setFontSize(LAYOUT.FONT_SIZES.SECTION_HEADER);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text(`${t.grandTotal}:`, totalsX + totalsPadding, totalsCurrentY);
    doc.text(`${currencySymbol}${order.total_amount.toFixed(2)}`, totalsX + totalsWidth - totalsPadding, totalsCurrentY, { align: 'right' });
    doc.setFont("helvetica", "normal");
    
    // PAYMENT DETAILS CARD - Fixed position
    if (order.shops.bank_accounts) {
      const paymentY = totalsY + totalsHeight + LAYOUT.SECTIONS.PAYMENT_Y_OFFSET;
      
      const cardHeight = 35;
      // Header
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.rect(LAYOUT.MARGIN, paymentY, contentWidth, 8, 'F');
      
      doc.setFontSize(LAYOUT.FONT_SIZES.SECTION_HEADER);
      doc.setTextColor(255, 255, 255);
      doc.text(t.paymentDetails, LAYOUT.MARGIN + 3, paymentY + 5);
      
      // Content area
      doc.setFillColor(...LAYOUT.COLORS.BACKGROUND_GRAY);
      doc.rect(LAYOUT.MARGIN, paymentY + 8, contentWidth, cardHeight - 8, 'F');
      doc.setDrawColor(rgb.r, rgb.g, rgb.b);
      doc.rect(LAYOUT.MARGIN, paymentY, contentWidth, cardHeight);
      
      let paymentContentY = paymentY + 13;
      doc.setFontSize(LAYOUT.FONT_SIZES.SMALL);
      doc.setTextColor(...LAYOUT.COLORS.PRIMARY_TEXT);
      
      const paymentLabelWidth = 30;
      const paymentPadding = 3;
      const maxPaymentValueWidth = contentWidth - paymentLabelWidth - (paymentPadding * 2);
      
      // Account holder
      const accountHolderName = order.shops.bank_accounts.use_anyname 
        ? order.shops.name 
        : order.shops.bank_accounts.account_holder;
      
      doc.text(`${t.accountHolder}:`, LAYOUT.MARGIN + paymentPadding, paymentContentY);
      const accountHolder = truncateText(doc, accountHolderName, maxPaymentValueWidth, LAYOUT.FONT_SIZES.SMALL);
      doc.text(accountHolder, LAYOUT.MARGIN + paymentPadding + paymentLabelWidth, paymentContentY);
      paymentContentY += 6;
      
      doc.text(`${t.iban}:`, LAYOUT.MARGIN + paymentPadding, paymentContentY);
      const iban = truncateText(doc, order.shops.bank_accounts.iban, maxPaymentValueWidth, LAYOUT.FONT_SIZES.SMALL);
      doc.text(iban, LAYOUT.MARGIN + paymentPadding + paymentLabelWidth, paymentContentY);
      paymentContentY += 6;
      
      if (order.shops.bank_accounts.bic) {
        doc.text(`${t.bic}:`, LAYOUT.MARGIN + paymentPadding, paymentContentY);
        const bic = truncateText(doc, order.shops.bank_accounts.bic, maxPaymentValueWidth, LAYOUT.FONT_SIZES.SMALL);
        doc.text(bic, LAYOUT.MARGIN + paymentPadding + paymentLabelWidth, paymentContentY);
        paymentContentY += 6;
      }
      
      doc.text(`${t.paymentReference}:`, LAYOUT.MARGIN + paymentPadding, paymentContentY);
      const reference = truncateText(doc, order.order_number, maxPaymentValueWidth, LAYOUT.FONT_SIZES.SMALL);
      doc.text(reference, LAYOUT.MARGIN + paymentPadding + paymentLabelWidth, paymentContentY);
    }
    
    // FOOTER - Fixed position
    const footerY = LAYOUT.SECTIONS.FOOTER_Y;
    
    // Footer background
    doc.setFillColor(...LAYOUT.COLORS.BACKGROUND_LIGHT);
    doc.rect(0, footerY - 5, LAYOUT.PAGE_WIDTH, 30, 'F');
    
    // 4-column layout
    const col1X = LAYOUT.MARGIN;
    const col2X = LAYOUT.MARGIN + (contentWidth * 0.25);
    const col3X = LAYOUT.MARGIN + (contentWidth * 0.5);
    const col4X = LAYOUT.MARGIN + (contentWidth * 0.75);
    const colWidth = contentWidth * 0.22; // Slightly less than 25% for padding
    
    doc.setFontSize(LAYOUT.FONT_SIZES.FOOTER);
    doc.setTextColor(...LAYOUT.COLORS.SECONDARY_TEXT);
    
    // Column 1: Company name and address
    doc.setFont("helvetica", "bold");
    const footerCompanyName = truncateText(doc, order.shops.company_name, colWidth, LAYOUT.FONT_SIZES.FOOTER);
    doc.text(footerCompanyName, col1X, footerY);
    doc.setFont("helvetica", "normal");
    
    const footerAddress = truncateText(doc, order.shops.company_address, colWidth, LAYOUT.FONT_SIZES.FOOTER);
    doc.text(footerAddress, col1X, footerY + 4);
    
    const footerCity = truncateText(doc, `${order.shops.company_postcode} ${order.shops.company_city}`, colWidth, LAYOUT.FONT_SIZES.FOOTER);
    doc.text(footerCity, col1X, footerY + 8);
    
    // Column 2: Contact information
    doc.setFont("helvetica", "bold");
    doc.text('Kontakt', col2X, footerY);
    doc.setFont("helvetica", "normal");
    
    if (order.shops.company_phone) {
      const footerPhone = truncateText(doc, order.shops.company_phone, colWidth, LAYOUT.FONT_SIZES.FOOTER);
      doc.text(footerPhone, col2X, footerY + 4);
    }
    
    const footerEmail = truncateText(doc, order.shops.company_email, colWidth, LAYOUT.FONT_SIZES.FOOTER);
    doc.text(footerEmail, col2X, footerY + 8);
    
    if (order.shops.company_website) {
      const footerWebsite = truncateText(doc, order.shops.company_website, colWidth, LAYOUT.FONT_SIZES.FOOTER);
      doc.text(footerWebsite, col2X, footerY + 12);
    }
    
    // Column 3: Bank information
    if (order.shops.bank_accounts) {
      doc.setFont("helvetica", "bold");
      doc.text('Bankinformationen', col3X, footerY);
      doc.setFont("helvetica", "normal");
      
      const accountHolderName = order.shops.bank_accounts.use_anyname 
        ? order.shops.name 
        : order.shops.bank_accounts.account_holder;
      
      const footerAccountHolder = truncateText(doc, accountHolderName, colWidth, LAYOUT.FONT_SIZES.FOOTER);
      doc.text(footerAccountHolder, col3X, footerY + 4);
      
      const footerIban = truncateText(doc, order.shops.bank_accounts.iban, colWidth, LAYOUT.FONT_SIZES.FOOTER);
      doc.text(footerIban, col3X, footerY + 8);
      
      if (order.shops.bank_accounts.bic) {
        const footerBic = truncateText(doc, order.shops.bank_accounts.bic, colWidth, LAYOUT.FONT_SIZES.FOOTER);
        doc.text(footerBic, col3X, footerY + 12);
      }
    }
    
    // Column 4: Business owner and VAT ID
    doc.setFont("helvetica", "bold");
    doc.text('Geschäftsdaten', col4X, footerY);
    doc.setFont("helvetica", "normal");
    
    if (order.shops.business_owner) {
      const footerOwner = truncateText(doc, order.shops.business_owner, colWidth, LAYOUT.FONT_SIZES.FOOTER);
      doc.text(footerOwner, col4X, footerY + 4);
    }
    
    if (order.shops.vat_number) {
      const footerVat = truncateText(doc, order.shops.vat_number, colWidth, LAYOUT.FONT_SIZES.FOOTER);
      doc.text(footerVat, col4X, footerY + 8);
    }
    
    console.log('Standardized PDF content created with consistent layout, converting to bytes...');
    
    // Get PDF as array buffer
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBytes = new Uint8Array(pdfArrayBuffer);
    
    console.log('PDF conversion completed, size:', pdfBytes.length, 'bytes');
    
    return pdfBytes;
    
  } catch (error) {
    console.error('Error generating standardized PDF:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}

serve(serve_handler);
