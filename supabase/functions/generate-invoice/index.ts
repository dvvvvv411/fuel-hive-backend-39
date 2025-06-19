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

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 37, g: 99, b: 235 }; // Default blue
}

// Helper function to fetch and convert logo to base64
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

const serve_handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { order_id, language: requestLanguage }: RequestBody = await req.json();

    console.log('Starting invoice generation for order:', order_id);
    console.log('Requested language:', requestLanguage);

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

    // Generate PDF content with translations
    const pdfContent = await generateInvoicePDF(order, invoiceNumber, t, currencySymbol, finalLanguage);

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

async function generateInvoicePDF(order: any, invoiceNumber: string, t: any, currencySymbol: string, language: string): Promise<Uint8Array> {
  try {
    console.log('Starting PDF generation with language:', language);
    
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
    
    let yPos = margin; // Start position
    
    // HEADER SECTION - Modern layout with logo and company details
    let logoBase64 = null;
    
    // Try to fetch and embed the actual logo
    if (order.shops.logo_url) {
      console.log('Attempting to fetch logo from:', order.shops.logo_url);
      logoBase64 = await fetchLogoAsBase64(order.shops.logo_url);
    }
    
    if (logoBase64) {
      // Display actual logo - doubled size from 40x25 to 80x50
      try {
        console.log('Adding logo to PDF');
        doc.addImage(logoBase64, 'JPEG', margin, yPos, 80, 50);
      } catch (logoError) {
        console.error('Error adding logo to PDF:', logoError);
        // Fall back to placeholder if logo fails to render
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPos, 80, 50, 'F');
        doc.setFontSize(12);
        doc.setTextColor(120, 120, 120);
        doc.text('LOGO', margin + 40, yPos + 25, { align: 'center' });
      }
    } else {
      // Logo placeholder (left side) - fallback with doubled size
      console.log('Using logo placeholder');
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos, 80, 50, 'F');
      doc.setFontSize(12);
      doc.setTextColor(120, 120, 120);
      doc.text('LOGO', margin + 40, yPos + 25, { align: 'center' });
    }
    
    // Company name and details (center-right) - adjusted positioning for larger logo
    const companyStartX = margin + 90; // Increased from 50 to 90
    doc.setFontSize(20);
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text(order.shops.company_name, companyStartX, yPos + 10);
    
    yPos += 15;
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(order.shops.company_address, companyStartX, yPos);
    yPos += 4;
    doc.text(`${order.shops.company_postcode} ${order.shops.company_city}`, companyStartX, yPos);
    yPos += 4;
    if (order.shops.company_phone) {
      doc.text(`${t.phone}: ${order.shops.company_phone}`, companyStartX, yPos);
      yPos += 4;
    }
    doc.text(`${t.email}: ${order.shops.company_email}`, companyStartX, yPos);
    yPos += 4;
    if (order.shops.company_website) {
      doc.text(`${t.website}: ${order.shops.company_website}`, companyStartX, yPos);
      yPos += 4;
    }
    if (order.shops.vat_number) {
      doc.text(`USt-IdNr: ${order.shops.vat_number}`, companyStartX, yPos);
    }
    
    // Reset position for invoice content - increased spacing for larger logo
    yPos = margin + 70; // Increased from 50 to 70
    
    // INVOICE TITLE
    doc.setFontSize(28);
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text(t.invoice, margin, yPos);
    yPos += 20;
    
    // TWO-COLUMN LAYOUT FOR ADDRESSES AND INVOICE DETAILS
    const leftColumnX = margin;
    const rightColumnX = margin + (contentWidth * 0.55);
    const columnStartY = yPos;
    
    // LEFT COLUMN - Address(es)
    yPos = columnStartY;
    
    // Billing Address (or single address if same)
    if (hasDifferentAddresses) {
      doc.setFontSize(12);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      doc.text(t.billingAddress, leftColumnX, yPos);
      yPos += 8;
    }
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(order.customer_name, leftColumnX, yPos);
    yPos += 5;
    
    const billingStreet = order.billing_street || order.delivery_street;
    const billingPostcode = order.billing_postcode || order.delivery_postcode;
    const billingCity = order.billing_city || order.delivery_city;
    
    doc.text(billingStreet, leftColumnX, yPos);
    yPos += 5;
    doc.text(`${billingPostcode} ${billingCity}`, leftColumnX, yPos);
    yPos += 10;
    
    // Delivery Address (if different)
    if (hasDifferentAddresses) {
      doc.setFontSize(12);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      doc.text(t.deliveryAddress, leftColumnX, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`${order.delivery_first_name} ${order.delivery_last_name}`, leftColumnX, yPos);
      yPos += 5;
      doc.text(order.delivery_street, leftColumnX, yPos);
      yPos += 5;
      doc.text(`${order.delivery_postcode} ${order.delivery_city}`, leftColumnX, yPos);
    }
    
    // RIGHT COLUMN - Invoice Details (reduced fields)
    yPos = columnStartY;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    const labelWidth = 35;
    
    // Removed invoice number, due date, and payment term
    doc.text(`${t.invoiceDate}:`, rightColumnX, yPos);
    doc.text(new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE'), rightColumnX + labelWidth, yPos);
    yPos += 6;
    
    doc.text(`${t.orderNumber}:`, rightColumnX, yPos);
    doc.text(order.order_number, rightColumnX + labelWidth, yPos);
    yPos += 6;
    
    doc.text(`${t.orderDate}:`, rightColumnX, yPos);
    doc.text(new Date(order.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE'), rightColumnX + labelWidth, yPos);
    
    // ITEMS TABLE
    yPos = Math.max(columnStartY + 50, yPos + 20);
    const tableStartY = yPos;
    
    // Modern table with accent color header
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.rect(margin, yPos, contentWidth, 10, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(t.description, margin + 3, yPos + 6);
    doc.text(t.quantity, margin + (contentWidth * 0.5), yPos + 6);
    doc.text(t.unitPrice, margin + (contentWidth * 0.65), yPos + 6);
    doc.text(t.total, margin + (contentWidth * 0.8), yPos + 6);
    
    yPos += 12;
    
    // Table content with alternating row colors
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    
    // Main product line
    doc.setFillColor(250, 250, 250);
    doc.rect(margin, yPos - 2, contentWidth, 8, 'F');
    
    doc.text(t.heatingOilDelivery, margin + 3, yPos + 4);
    doc.text(`${order.liters} ${t.liters}`, margin + (contentWidth * 0.5), yPos + 4);
    doc.text(`${currencySymbol}${order.price_per_liter.toFixed(3)}`, margin + (contentWidth * 0.65), yPos + 4);
    doc.text(`${currencySymbol}${order.base_price.toFixed(2)}`, margin + (contentWidth * 0.8), yPos + 4);
    yPos += 10;
    
    // Delivery fee if applicable
    if (order.delivery_fee > 0) {
      doc.text(t.deliveryFee, margin + 3, yPos + 4);
      doc.text('1', margin + (contentWidth * 0.5), yPos + 4);
      doc.text(`${currencySymbol}${order.delivery_fee.toFixed(2)}`, margin + (contentWidth * 0.65), yPos + 4);
      doc.text(`${currencySymbol}${order.delivery_fee.toFixed(2)}`, margin + (contentWidth * 0.8), yPos + 4);
      yPos += 10;
    }
    
    // Table border
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.rect(margin, tableStartY, contentWidth, yPos - tableStartY);
    
    // TOTALS SECTION
    yPos += 15;
    const totalsX = margin + (contentWidth * 0.6);
    const totalsBoxWidth = contentWidth * 0.4;
    
    // Totals background
    doc.setFillColor(248, 249, 250);
    doc.rect(totalsX, yPos - 5, totalsBoxWidth, 25, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.rect(totalsX, yPos - 5, totalsBoxWidth, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    doc.text(`${t.subtotal}:`, totalsX + 3, yPos + 2);
    doc.text(`${currencySymbol}${totalWithoutVat.toFixed(2)}`, totalsX + totalsBoxWidth - 3, yPos + 2, { align: 'right' });
    yPos += 6;
    
    doc.text(`${t.vat} (${vatRate}%):`, totalsX + 3, yPos + 2);
    doc.text(`${currencySymbol}${vatAmount.toFixed(2)}`, totalsX + totalsBoxWidth - 3, yPos + 2, { align: 'right' });
    yPos += 8;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text(`${t.grandTotal}:`, totalsX + 3, yPos + 2);
    doc.text(`${currencySymbol}${order.total_amount.toFixed(2)}`, totalsX + totalsBoxWidth - 3, yPos + 2, { align: 'right' });
    doc.setFont("helvetica", "normal");
    
    // PAYMENT DETAILS CARD
    if (order.shops.bank_accounts) {
      yPos += 25;
      
      // Payment card background with accent color
      const cardHeight = 35;
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.rect(margin, yPos, contentWidth, 8, 'F');
      
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text(t.paymentDetails, margin + 3, yPos + 5);
      
      yPos += 8;
      doc.setFillColor(248, 249, 250);
      doc.rect(margin, yPos, contentWidth, cardHeight - 8, 'F');
      doc.setDrawColor(rgb.r, rgb.g, rgb.b);
      doc.rect(margin, yPos - 8, contentWidth, cardHeight);
      
      yPos += 5;
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      
      const paymentLabelWidth = 30;
      
      // Use shop name if use_anyname is enabled, otherwise use account holder
      const accountHolderName = order.shops.bank_accounts.use_anyname 
        ? order.shops.name 
        : order.shops.bank_accounts.account_holder;
      
      doc.text(`${t.accountHolder}:`, margin + 3, yPos);
      doc.text(accountHolderName, margin + 3 + paymentLabelWidth, yPos);
      yPos += 5;
      
      doc.text(`${t.iban}:`, margin + 3, yPos);
      doc.text(order.shops.bank_accounts.iban, margin + 3 + paymentLabelWidth, yPos);
      yPos += 5;
      
      if (order.shops.bank_accounts.bic) {
        doc.text(`${t.bic}:`, margin + 3, yPos);
        doc.text(order.shops.bank_accounts.bic, margin + 3 + paymentLabelWidth, yPos);
        yPos += 5;
      }
      
      // Use order number instead of invoice number for payment reference
      doc.text(`${t.paymentReference}:`, margin + 3, yPos);
      doc.text(order.order_number, margin + 3 + paymentLabelWidth, yPos);
      yPos += 5;
      
      // Removed payment term
    }
    
    // FOOTER - 4 columns with modern styling
    const footerY = pageHeight - 35;
    
    // Footer background stripe
    doc.setFillColor(250, 250, 250);
    doc.rect(0, footerY - 5, pageWidth, 30, 'F');
    
    // Footer content in 4 columns
    const col1X = margin;
    const col2X = margin + (contentWidth * 0.25);
    const col3X = margin + (contentWidth * 0.5);
    const col4X = margin + (contentWidth * 0.75);
    
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    
    // Column 1: Contact
    doc.setFont("helvetica", "bold");
    doc.text('Kontakt', col1X, footerY);
    doc.setFont("helvetica", "normal");
    doc.text(order.shops.company_email, col1X, footerY + 4);
    if (order.shops.support_phone) {
      doc.text(order.shops.support_phone, col1X, footerY + 8);
    }
    
    // Column 2: Legal
    doc.setFont("helvetica", "bold");
    doc.text('Rechtliches', col2X, footerY);
    doc.setFont("helvetica", "normal");
    if (order.shops.business_owner) {
      doc.text(`Inhaber: ${order.shops.business_owner}`, col2X, footerY + 4);
    }
    if (order.shops.vat_number) {
      doc.text(`USt-IdNr: ${order.shops.vat_number}`, col2X, footerY + 8);
    }
    
    // Column 3: Registration
    if (order.shops.court_name || order.shops.registration_number) {
      doc.setFont("helvetica", "bold");
      doc.text('Registrierung', col3X, footerY);
      doc.setFont("helvetica", "normal");
      if (order.shops.court_name) {
        doc.text(order.shops.court_name, col3X, footerY + 4);
      }
      if (order.shops.registration_number) {
        doc.text(`Nr: ${order.shops.registration_number}`, col3X, footerY + 8);
      }
    }
    
    // Column 4: Thank you message
    doc.setFont("helvetica", "bold");
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text(t.thankYou, col4X, footerY + 4);
    
    console.log('PDF content created with logo support and language', language, ', converting to bytes...');
    
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
