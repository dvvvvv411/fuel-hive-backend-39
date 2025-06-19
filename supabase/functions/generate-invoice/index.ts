import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import jsPDF from "npm:jspdf@3.0.1";
import { getTranslations, detectLanguage } from './translations.ts';

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
    heatingOilDelivery: 'Levering van eldningsolja',
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

// RESPONSIVE LAYOUT SYSTEM - Dynamic scaling based on content measurement
const BASE_LAYOUT = {
  // Page dimensions (A4)
  PAGE_WIDTH: 210,
  PAGE_HEIGHT: 297,
  MARGIN: 20,
  CONTENT_HEIGHT: 257, // PAGE_HEIGHT - (2 * MARGIN)
  
  // Minimum required sections with base heights
  MIN_SECTIONS: {
    HEADER: 30,
    TITLE: 12,
    ADDRESSES: 35,
    TABLE_HEADER: 8,
    TABLE_MIN_ROWS: 16, // Minimum space for product rows
    TOTALS: 20,
    PAYMENT: 35,
    FOOTER: 25
  }
};

// Language-specific optimization factors
const LANGUAGE_FACTORS = {
  'de': { textDensity: 1.0, lineHeight: 1.0 },
  'en': { textDensity: 0.95, lineHeight: 1.0 },
  'fr': { textDensity: 1.05, lineHeight: 1.0 },
  'es': { textDensity: 1.1, lineHeight: 1.0 },
  'it': { textDensity: 1.05, lineHeight: 1.0 },
  'nl': { textDensity: 1.15, lineHeight: 1.0 },
  'pt': { textDensity: 1.1, lineHeight: 1.0 },
  'pl': { textDensity: 1.1, lineHeight: 1.1 },
  'sv': { textDensity: 1.0, lineHeight: 1.0 },
  'da': { textDensity: 1.0, lineHeight: 1.0 },
  'no': { textDensity: 1.0, lineHeight: 1.0 },
  'fi': { textDensity: 1.05, lineHeight: 1.0 }
};

// Calculate dynamic layout based on content and language
function calculateResponsiveLayout(order: any, t: any, language: string): any {
  console.log(`[LAYOUT] Calculating responsive layout for language: ${language}`);
  
  const langFactor = LANGUAGE_FACTORS[language as keyof typeof LANGUAGE_FACTORS] || LANGUAGE_FACTORS.de;
  const contentWidth = BASE_LAYOUT.PAGE_WIDTH - (2 * BASE_LAYOUT.MARGIN);
  
  // Calculate required content height
  let requiredHeight = 0;
  
  // Header section - increased to accommodate potential multi-line company names
  requiredHeight += BASE_LAYOUT.MIN_SECTIONS.HEADER * 1.3;
  
  // Title section
  requiredHeight += BASE_LAYOUT.MIN_SECTIONS.TITLE;
  
  // Address section (varies by whether addresses are different)
  const hasDifferentAddresses = order.billing_street && 
    (order.billing_street !== order.delivery_street ||
     order.billing_postcode !== order.delivery_postcode ||
     order.billing_city !== order.delivery_city);
  
  const addressHeight = hasDifferentAddresses ? 
    BASE_LAYOUT.MIN_SECTIONS.ADDRESSES * 1.6 : 
    BASE_LAYOUT.MIN_SECTIONS.ADDRESSES;
  requiredHeight += addressHeight;
  
  // Table section
  requiredHeight += BASE_LAYOUT.MIN_SECTIONS.TABLE_HEADER;
  let tableRows = 1; // Main product
  if (order.delivery_fee > 0) tableRows++;
  requiredHeight += tableRows * 6 * langFactor.lineHeight;
  
  // Totals section
  requiredHeight += BASE_LAYOUT.MIN_SECTIONS.TOTALS;
  
  // Payment section (if bank account exists)
  if (order.shops.bank_accounts) {
    requiredHeight += BASE_LAYOUT.MIN_SECTIONS.PAYMENT * langFactor.textDensity;
  }
  
  // Footer section - increased to accommodate potential multi-line company names
  requiredHeight += BASE_LAYOUT.MIN_SECTIONS.FOOTER * 1.3;
  
  console.log(`[LAYOUT] Required content height: ${requiredHeight}mm, Available: ${BASE_LAYOUT.CONTENT_HEIGHT}mm`);
  
  // Calculate scaling factor if content exceeds available space
  const scaleFactor = Math.min(1.0, BASE_LAYOUT.CONTENT_HEIGHT / requiredHeight);
  console.log(`[LAYOUT] Scaling factor: ${scaleFactor.toFixed(3)}`);
  
  // Apply scaling to create dynamic layout
  const layout = {
    PAGE_WIDTH: BASE_LAYOUT.PAGE_WIDTH,
    PAGE_HEIGHT: BASE_LAYOUT.PAGE_HEIGHT,
    MARGIN: BASE_LAYOUT.MARGIN,
    SCALE_FACTOR: scaleFactor,
    
    // Scaled dimensions
    HEADER: {
      HEIGHT: BASE_LAYOUT.MIN_SECTIONS.HEADER * scaleFactor * 1.3,
      LOGO_MAX_WIDTH: 25 * scaleFactor, // Reduced base size
      LOGO_MAX_HEIGHT: 18 * scaleFactor,
      COMPANY_START_X_OFFSET: (25 * scaleFactor) + 6
    },
    
    SECTIONS: {
      TITLE_HEIGHT: BASE_LAYOUT.MIN_SECTIONS.TITLE * scaleFactor,
      ADDRESS_HEIGHT: addressHeight * scaleFactor,
      TABLE_ROW_HEIGHT: 6 * scaleFactor * langFactor.lineHeight,
      TABLE_HEADER_HEIGHT: 8 * scaleFactor,
      TOTALS_HEIGHT: BASE_LAYOUT.MIN_SECTIONS.TOTALS * scaleFactor,
      PAYMENT_HEIGHT: BASE_LAYOUT.MIN_SECTIONS.PAYMENT * scaleFactor * langFactor.textDensity,
      FOOTER_HEIGHT: BASE_LAYOUT.MIN_SECTIONS.FOOTER * scaleFactor * 1.3
    },
    
    // Dynamic font sizes based on scaling
    FONT_SIZES: {
      TITLE: Math.max(16, 24 * scaleFactor),
      SECTION_HEADER: Math.max(8, 11 * scaleFactor),
      NORMAL: Math.max(7, 9 * scaleFactor),
      SMALL: Math.max(6, 8 * scaleFactor),
      FOOTER: Math.max(5, 7 * scaleFactor)
    },
    
    // Colors remain constant
    COLORS: {
      PRIMARY_TEXT: [0, 0, 0],
      SECONDARY_TEXT: [80, 80, 80],
      LIGHT_TEXT: [120, 120, 120],
      BACKGROUND_LIGHT: [250, 250, 250],
      BACKGROUND_GRAY: [248, 249, 250],
      BORDER_LIGHT: [220, 220, 220]
    },
    
    // Language-specific adjustments
    LANGUAGE_FACTOR: langFactor
  };
  
  // Calculate dynamic positions
  layout.POSITIONS = {
    HEADER_Y: layout.MARGIN,
    TITLE_Y: layout.MARGIN + layout.HEADER.HEIGHT + 12, // Moved title down by 4mm
    ADDRESS_Y: layout.MARGIN + layout.HEADER.HEIGHT + layout.SECTIONS.TITLE_HEIGHT + 15,
    DETAILS_Y: layout.MARGIN + layout.HEADER.HEIGHT + layout.SECTIONS.TITLE_HEIGHT + 15,
    TABLE_Y: layout.MARGIN + layout.HEADER.HEIGHT + layout.SECTIONS.TITLE_HEIGHT + layout.SECTIONS.ADDRESS_HEIGHT + 25,
    TOTALS_Y_OFFSET: 15 * scaleFactor,
    PAYMENT_Y_OFFSET: 20 * scaleFactor,
    FOOTER_Y: BASE_LAYOUT.PAGE_HEIGHT - layout.SECTIONS.FOOTER_HEIGHT - 10
  };
  
  console.log(`[LAYOUT] Dynamic layout calculated with ${Object.keys(layout.POSITIONS).length} positions`);
  return layout;
}

// Enhanced content measurement and optimization
function optimizeTextForSpace(doc: any, text: string, maxWidth: number, fontSize: number, language: string): string {
  const langFactor = LANGUAGE_FACTORS[language as keyof typeof LANGUAGE_FACTORS] || LANGUAGE_FACTORS.de;
  const adjustedMaxWidth = maxWidth * langFactor.textDensity;
  
  doc.setFontSize(fontSize);
  const textWidth = doc.getTextWidth(text);
  
  if (textWidth <= adjustedMaxWidth) {
    return text;
  }
  
  // Smart truncation with language-specific considerations
  const words = text.split(' ');
  if (words.length === 1) {
    // Single word - truncate with ellipsis
    let truncated = text;
    while (doc.getTextWidth(truncated + '...') > adjustedMaxWidth && truncated.length > 1) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + '...';
  }
  
  // Multiple words - remove words from the end
  let result = text;
  while (doc.getTextWidth(result + '...') > adjustedMaxWidth && result.includes(' ')) {
    const lastSpace = result.lastIndexOf(' ');
    result = result.substring(0, lastSpace);
  }
  
  return result + (result !== text ? '...' : '');
}

// New function to wrap text to multiple lines
function wrapTextToFitWidth(doc: any, text: string, maxWidth: number, fontSize: number, language: string): string[] {
  const langFactor = LANGUAGE_FACTORS[language as keyof typeof LANGUAGE_FACTORS] || LANGUAGE_FACTORS.de;
  const adjustedMaxWidth = maxWidth * langFactor.textDensity;
  
  doc.setFontSize(fontSize);
  const textWidth = doc.getTextWidth(text);
  
  // If text fits on one line, return as single line
  if (textWidth <= adjustedMaxWidth) {
    return [text];
  }
  
  console.log(`[WRAP] Text "${text}" (${textWidth.toFixed(1)}mm) exceeds max width ${adjustedMaxWidth.toFixed(1)}mm, wrapping...`);
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = doc.getTextWidth(testLine);
    
    if (testWidth <= adjustedMaxWidth) {
      currentLine = testLine;
    } else {
      // If current line has content, add it and start new line with current word
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Single word is too long, truncate it
        let truncated = word;
        while (doc.getTextWidth(truncated) > adjustedMaxWidth && truncated.length > 1) {
          truncated = truncated.slice(0, -1);
        }
        lines.push(truncated);
        currentLine = '';
      }
    }
  }
  
  // Add the last line if it has content
  if (currentLine) {
    lines.push(currentLine);
  }
  
  console.log(`[WRAP] Wrapped into ${lines.length} lines:`, lines);
  return lines;
}

// Helper function to render wrapped text and return the total height used
function renderWrappedText(doc: any, lines: string[], x: number, y: number, lineSpacing: number): number {
  let currentY = y;
  for (const line of lines) {
    doc.text(line, x, currentY);
    currentY += lineSpacing;
  }
  return (lines.length - 1) * lineSpacing; // Return additional height used beyond first line
}

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 37, g: 99, b: 235 };
}

// Enhanced logo handling with dynamic sizing
function calculateLogoProportions(originalWidth: number, originalHeight: number, maxWidth: number, maxHeight: number): { width: number; height: number; x: number; y: number } {
  console.log(`[LOGO] Calculating proportions: original ${originalWidth}x${originalHeight}, max ${maxWidth.toFixed(1)}x${maxHeight.toFixed(1)}`);
  
  const widthRatio = maxWidth / originalWidth;
  const heightRatio = maxHeight / originalHeight;
  const scale = Math.min(widthRatio, heightRatio);
  
  const scaledWidth = originalWidth * scale;
  const scaledHeight = originalHeight * scale;
  
  // Center the logo within the available space
  const offsetX = (maxWidth - scaledWidth) / 2;
  const offsetY = (maxHeight - scaledHeight) / 2;
  
  console.log(`[LOGO] Final proportions: ${scaledWidth.toFixed(1)}x${scaledHeight.toFixed(1)}mm with offsets (${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`);
  
  return {
    width: scaledWidth,
    height: scaledHeight,
    x: offsetX,
    y: offsetY
  };
}

// Enhanced image format detection
function detectImageFormat(contentType: string, uint8Array: Uint8Array): string {
  console.log(`[LOGO] Detecting format from content-type: ${contentType}`);
  
  if (uint8Array.length >= 8) {
    // PNG magic bytes
    if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && uint8Array[2] === 0x4E && uint8Array[3] === 0x47) {
      console.log(`[LOGO] Format detected: PNG`);
      return 'PNG';
    }
    
    // JPEG magic bytes
    if (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF) {
      console.log(`[LOGO] Format detected: JPEG`);
      return 'JPEG';
    }
    
    // WebP magic bytes
    if (uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x46 &&
        uint8Array[8] === 0x57 && uint8Array[9] === 0x45 && uint8Array[10] === 0x42 && uint8Array[11] === 0x50) {
      console.log(`[LOGO] Format detected: WEBP`);
      return 'WEBP';
    }
  }
  
  // Fallback to content type
  if (contentType.includes('png')) return 'PNG';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'JPEG';
  if (contentType.includes('webp')) return 'WEBP';
  
  console.log(`[LOGO] Format fallback: JPEG`);
  return 'JPEG';
}

// Enhanced dimension extraction
function extractImageDimensions(uint8Array: Uint8Array, format: string): { width?: number; height?: number } {
  console.log(`[LOGO] Extracting dimensions for: ${format}`);
  
  try {
    if (format === 'PNG' && uint8Array.length >= 24) {
      const width = (uint8Array[16] << 24) | (uint8Array[17] << 16) | (uint8Array[18] << 8) | uint8Array[19];
      const height = (uint8Array[20] << 24) | (uint8Array[21] << 16) | (uint8Array[22] << 8) | uint8Array[23];
      
      if (width > 0 && height > 0 && width < 65536 && height < 65536) {
        console.log(`[LOGO] PNG dimensions: ${width}x${height}`);
        return { width, height };
      }
    } else if (format === 'JPEG') {
      let offset = 2;
      
      while (offset < uint8Array.length - 8) {
        if (uint8Array[offset] === 0xFF && 
            (uint8Array[offset + 1] === 0xC0 || uint8Array[offset + 1] === 0xC2)) {
          
          const height = (uint8Array[offset + 5] << 8) | uint8Array[offset + 6];
          const width = (uint8Array[offset + 7] << 8) | uint8Array[offset + 8];
          
          if (width > 0 && height > 0 && width < 65536 && height < 65536) {
            console.log(`[LOGO] JPEG dimensions: ${width}x${height}`);
            return { width, height };
          }
        }
        offset += 2;
      }
    }
  } catch (error) {
    console.warn(`[LOGO] Error extracting dimensions:`, error);
  }
  
  console.log(`[LOGO] Could not extract dimensions`);
  return {};
}

// Enhanced logo fetching and processing
async function fetchAndProcessLogo(logoUrl: string): Promise<{ base64: string; width?: number; height?: number; format: string } | null> {
  try {
    console.log(`[LOGO] Fetching logo: ${logoUrl}`);
    
    const response = await fetch(logoUrl);
    if (!response.ok) {
      console.error(`[LOGO] Fetch failed: ${response.status}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      console.error(`[LOGO] Invalid content type: ${contentType}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    console.log(`[LOGO] Image data fetched: ${uint8Array.byteLength} bytes`);
    
    const format = detectImageFormat(contentType, uint8Array);
    const dimensions = extractImageDimensions(uint8Array, format);
    
    // Convert to base64
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    
    console.log(`[LOGO] Logo processed: format=${format}, base64=${base64.length} chars`);
    
    return {
      base64: `data:${contentType};base64,${base64}`,
      width: dimensions.width,
      height: dimensions.height,
      format
    };
  } catch (error) {
    console.error(`[LOGO] Processing error:`, error);
    return null;
  }
}

// Enhanced logo rendering with responsive sizing
function renderResponsiveLogo(doc: any, logoData: { base64: string; width?: number; height?: number; format: string } | null, layout: any, x: number, y: number, accentColor: { r: number; g: number; b: number }): void {
  console.log(`[LOGO] Rendering responsive logo at (${x}, ${y})`);
  
  if (!logoData?.base64) {
    console.log(`[LOGO] No logo data, rendering placeholder`);
    renderLogoPlaceholder(doc, x, y, layout, accentColor);
    return;
  }

  try {
    const originalWidth = logoData.width || 200;
    const originalHeight = logoData.height || 150;
    
    console.log(`[LOGO] Original dimensions: ${originalWidth}x${originalHeight}`);
    
    const proportions = calculateLogoProportions(
      originalWidth,
      originalHeight,
      layout.HEADER.LOGO_MAX_WIDTH,
      layout.HEADER.LOGO_MAX_HEIGHT
    );
    
    const finalX = x + proportions.x;
    const finalY = y + proportions.y;
    
    console.log(`[LOGO] Rendering at (${finalX.toFixed(2)}, ${finalY.toFixed(2)}) size ${proportions.width.toFixed(2)}x${proportions.height.toFixed(2)}`);
    
    doc.addImage(
      logoData.base64,
      logoData.format,
      finalX,
      finalY,
      proportions.width,
      proportions.height
    );
    
    console.log(`[LOGO] Logo rendered successfully`);
    
  } catch (error) {
    console.error(`[LOGO] Render error:`, error);
    
    // Try format fallbacks
    if (logoData.format !== 'JPEG') {
      try {
        console.log(`[LOGO] Trying JPEG fallback`);
        const originalWidth = logoData.width || 200;
        const originalHeight = logoData.height || 150;
        const proportions = calculateLogoProportions(
          originalWidth, originalHeight,
          layout.HEADER.LOGO_MAX_WIDTH, layout.HEADER.LOGO_MAX_HEIGHT
        );
        
        doc.addImage(logoData.base64, 'JPEG', x + proportions.x, y + proportions.y, proportions.width, proportions.height);
        console.log(`[LOGO] JPEG fallback successful`);
        return;
      } catch (fallbackError) {
        console.warn(`[LOGO] JPEG fallback failed:`, fallbackError);
      }
    }
    
    // Final fallback
    console.log(`[LOGO] Using placeholder fallback`);
    renderLogoPlaceholder(doc, x, y, layout, accentColor);
  }
}

// Enhanced logo placeholder with responsive sizing
function renderLogoPlaceholder(doc: any, x: number, y: number, layout: any, accentColor: { r: number; g: number; b: number }): void {
  console.log(`[LOGO] Rendering responsive placeholder`);
  
  const width = layout.HEADER.LOGO_MAX_WIDTH;
  const height = layout.HEADER.LOGO_MAX_HEIGHT;
  
  // Background
  doc.setFillColor(...layout.COLORS.BACKGROUND_LIGHT);
  doc.rect(x, y, width, height, 'F');
  
  // Border
  doc.setDrawColor(accentColor.r, accentColor.g, accentColor.b);
  doc.setLineWidth(0.5 * layout.SCALE_FACTOR);
  doc.rect(x, y, width, height);
  
  // Text
  doc.setFontSize(layout.FONT_SIZES.SMALL);
  doc.setTextColor(accentColor.r, accentColor.g, accentColor.b);
  doc.text('LOGO', x + width/2, y + height/2, { align: 'center' });
  
  console.log(`[LOGO] Placeholder rendered: ${width.toFixed(1)}x${height.toFixed(1)}mm`);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
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
    const { order_id, language: requestedLanguage }: RequestBody = await req.json();
    console.log('Starting invoice generation for order:', order_id);
    console.log('Requested language:', requestedLanguage);

    // Get order details with shop information
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        shops (
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
          language,
          logo_url,
          accent_color,
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

    // Get bank data - prioritize temporary bank accounts
    let bankData = null;
    
    // First, check for temporary bank account associated with this order
    const { data: tempBankAccounts, error: tempBankError } = await supabase
      .from('bank_accounts')
      .select('account_holder, bank_name, iban, bic, use_anyname, account_name')
      .eq('is_temporary', true)
      .eq('used_for_order_id', order_id)
      .eq('active', true);

    if (tempBankError) {
      console.error('Error fetching temporary bank accounts:', tempBankError);
    }

    if (tempBankAccounts && tempBankAccounts.length > 0) {
      // Use the first temporary bank account found
      const tempBank = tempBankAccounts[0];
      console.log('Using temporary bank account:', tempBank.account_name);
      bankData = {
        ...tempBank,
        account_holder: tempBank.use_anyname ? order.shops.name : tempBank.account_holder
      };
    } else if (order.shops?.bank_account_id) {
      console.log('Using shop default bank account');
      // Fallback to shop's default bank account
      const { data: defaultBank, error: bankError } = await supabase
        .from('bank_accounts')
        .select('account_holder, bank_name, iban, bic, use_anyname, account_name')
        .eq('id', order.shops.bank_account_id)
        .eq('active', true)
        .single();

      if (!bankError && defaultBank) {
        bankData = {
          ...defaultBank,
          account_holder: defaultBank.use_anyname ? order.shops.name : defaultBank.account_holder
        };
      } else {
        console.error('Could not fetch bank data:', bankError);
      }
    }

    // Determine language
    const language = requestedLanguage || detectLanguage(order);
    console.log('Final language for PDF:', language);

    // Use temp_order_number if available, otherwise use original order_number
    const orderNumberForInvoice = order.temp_order_number || order.order_number;
    console.log('Using order number for invoice:', orderNumberForInvoice);

    // Generate filename using the correct order number
    const fileName = `rechnung_${orderNumberForInvoice}_${language}.pdf`;
    console.log('Generating responsive PDF with filename:', fileName);

    // Generate responsive PDF
    console.log('Starting responsive PDF generation with language:', language);
    
    const pdfBytes = await generateResponsivePDF(order, bankData, language);
    console.log('Responsive PDF generated successfully, size:', pdfBytes.length, 'bytes');

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    console.log('PDF uploaded successfully:', fileName);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
      .getPublicUrl(fileName);

    console.log('PDF public URL:', publicUrl);

    // Update order with invoice details
    const updateData = {
      invoice_pdf_generated: true,
      invoice_pdf_url: publicUrl,
      invoice_generation_date: new Date().toISOString(),
      invoice_date: order.invoice_date || new Date().toISOString().split('T')[0]
    };

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order_id);

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    console.log('Order updated successfully with invoice details');

    return new Response(JSON.stringify({
      success: true,
      invoice_url: publicUrl,
      filename: fileName,
      order_number: orderNumberForInvoice,
      language: language,
      bank_account_used: bankData?.account_name || 'none',
      generated_at: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error in generate-invoice function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate invoice',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

async function generateResponsivePDF(order: any, bankData: any, language: string): Promise<Uint8Array> {
  try {
    console.log('Starting responsive PDF generation with language:', language);
    
    // Import jsPDF dynamically
    const { jsPDF } = await import("https://esm.sh/jspdf@2.5.1");
    
    // Calculate responsive layout based on content and language
    const layout = calculateResponsiveLayout(order, getInvoiceTranslations(language), language);
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const contentWidth = layout.PAGE_WIDTH - (2 * layout.MARGIN);
    
    // Get accent color from shop settings
    const accentColor = hexToRgb(order.shops.accent_color || '#2563eb');
    
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
    
    // HEADER SECTION - Enhanced with text wrapping
    let logoData = null;
    
    // Fetch logo with enhanced analysis
    if (order.shops.logo_url) {
      console.log(`[LOGO] Processing shop logo: ${order.shops.logo_url}`);
      const cacheBustedUrl = `${order.shops.logo_url}?v=${Date.now()}`;
      logoData = await fetchAndProcessLogo(cacheBustedUrl);
    } else {
      console.log(`[LOGO] No logo URL provided in shop settings`);
    }
    
    // Render responsive logo
    renderResponsiveLogo(doc, logoData, layout, layout.MARGIN, layout.POSITIONS.HEADER_Y, accentColor);
    
    // Company details with text wrapping
    const companyStartX = layout.MARGIN + layout.HEADER.COMPANY_START_X_OFFSET;
    const maxCompanyWidth = contentWidth - layout.HEADER.COMPANY_START_X_OFFSET;
    
    doc.setFontSize(layout.FONT_SIZES.TITLE);
    doc.setTextColor(accentColor.r, accentColor.g, accentColor.b);
    
    // Wrap company name instead of truncating
    const companyNameLines = wrapTextToFitWidth(doc, order.shops.company_name, maxCompanyWidth, layout.FONT_SIZES.TITLE, language);
    let companyY = layout.POSITIONS.HEADER_Y + (10 * layout.SCALE_FACTOR);
    const titleLineSpacing = 6 * layout.SCALE_FACTOR * layout.LANGUAGE_FACTOR.lineHeight;
    
    for (const line of companyNameLines) {
      doc.text(line, companyStartX, companyY);
      companyY += titleLineSpacing;
    }
    
    // Adjust starting position for company details based on company name height
    companyY += 3 * layout.SCALE_FACTOR; // Small gap after company name
    
    doc.setFontSize(layout.FONT_SIZES.SMALL);
    doc.setTextColor(...layout.COLORS.SECONDARY_TEXT);
    
    const lineSpacing = 4 * layout.SCALE_FACTOR * layout.LANGUAGE_FACTOR.lineHeight;
    
    const companyAddress = optimizeTextForSpace(doc, order.shops.company_address, maxCompanyWidth, layout.FONT_SIZES.SMALL, language);
    doc.text(companyAddress, companyStartX, companyY);
    companyY += lineSpacing;
    
    const cityPostcode = optimizeTextForSpace(doc, `${order.shops.company_postcode} ${order.shops.company_city}`, maxCompanyWidth, layout.FONT_SIZES.SMALL, language);
    doc.text(cityPostcode, companyStartX, companyY);
    companyY += lineSpacing;
    
    if (order.shops.company_phone) {
      const phone = optimizeTextForSpace(doc, `${getInvoiceTranslations(language).phone}: ${order.shops.company_phone}`, maxCompanyWidth, layout.FONT_SIZES.SMALL, language);
      doc.text(phone, companyStartX, companyY);
      companyY += lineSpacing;
    }
    
    const email = optimizeTextForSpace(doc, `${getInvoiceTranslations(language).email}: ${order.shops.company_email}`, maxCompanyWidth, layout.FONT_SIZES.SMALL, language);
    doc.text(email, companyStartX, companyY);
    companyY += lineSpacing;
    
    if (order.shops.company_website) {
      const website = optimizeTextForSpace(doc, `${getInvoiceTranslations(language).website}: ${order.shops.company_website}`, maxCompanyWidth, layout.FONT_SIZES.SMALL, language);
      doc.text(website, companyStartX, companyY);
      companyY += lineSpacing;
    }
    
    if (order.shops.vat_number) {
      const vat = optimizeTextForSpace(doc, `USt-IdNr: ${order.shops.vat_number}`, maxCompanyWidth, layout.FONT_SIZES.SMALL, language);
      doc.text(vat, companyStartX, companyY);
    }
    
    // INVOICE TITLE - Fixed position
    doc.setFontSize(layout.FONT_SIZES.TITLE);
    doc.setTextColor(accentColor.r, accentColor.g, accentColor.b);
    doc.text(getInvoiceTranslations(language).invoice, layout.MARGIN, layout.POSITIONS.TITLE_Y);
    
    // RESPONSIVE TWO-COLUMN LAYOUT
    const leftColumnX = layout.MARGIN;
    const rightColumnX = layout.MARGIN + (contentWidth * 0.55);
    const leftColumnWidth = contentWidth * 0.45;
    const rightColumnWidth = contentWidth * 0.4;
    
    // LEFT COLUMN - Address(es) - Fixed height allocation
    let addressY = layout.POSITIONS.ADDRESS_Y;
    
    // Billing Address (or single address if same)
    if (hasDifferentAddresses) {
      doc.setFontSize(layout.FONT_SIZES.SECTION_HEADER);
      doc.setTextColor(accentColor.r, accentColor.g, accentColor.b);
      doc.text(getInvoiceTranslations(language).billingAddress, leftColumnX, addressY);
      addressY += 8 * layout.SCALE_FACTOR;
    }
    
    doc.setFontSize(layout.FONT_SIZES.NORMAL);
    doc.setTextColor(...layout.COLORS.PRIMARY_TEXT);
    
    const addressLineSpacing = 5 * layout.SCALE_FACTOR * layout.LANGUAGE_FACTOR.lineHeight;
    
    const customerName = optimizeTextForSpace(doc, order.customer_name, leftColumnWidth, layout.FONT_SIZES.NORMAL, language);
    doc.text(customerName, leftColumnX, addressY);
    addressY += addressLineSpacing;
    
    const billingStreet = order.billing_street || order.delivery_street;
    const billingPostcode = order.billing_postcode || order.delivery_postcode;
    const billingCity = order.billing_city || order.delivery_city;
    
    const street = optimizeTextForSpace(doc, billingStreet, leftColumnWidth, layout.FONT_SIZES.NORMAL, language);
    doc.text(street, leftColumnX, addressY);
    addressY += addressLineSpacing;
    
    const cityLine = optimizeTextForSpace(doc, `${billingPostcode} ${billingCity}`, leftColumnWidth, layout.FONT_SIZES.NORMAL, language);
    doc.text(cityLine, leftColumnX, addressY);
    addressY += addressLineSpacing * 2;
    
    // Delivery Address (if different) - within fixed height
    if (hasDifferentAddresses && addressY < layout.POSITIONS.ADDRESS_Y + layout.SECTIONS.ADDRESS_HEIGHT - (20 * layout.SCALE_FACTOR)) {
      doc.setFontSize(layout.FONT_SIZES.SECTION_HEADER);
      doc.setTextColor(accentColor.r, accentColor.g, accentColor.b);
      doc.text(getInvoiceTranslations(language).deliveryAddress, leftColumnX, addressY);
      addressY += 8 * layout.SCALE_FACTOR;
      
      doc.setFontSize(layout.FONT_SIZES.NORMAL);
      doc.setTextColor(...layout.COLORS.PRIMARY_TEXT);
      
      const deliveryName = optimizeTextForSpace(doc, `${order.delivery_first_name} ${order.delivery_last_name}`, leftColumnWidth, layout.FONT_SIZES.NORMAL, language);
      doc.text(deliveryName, leftColumnX, addressY);
      addressY += addressLineSpacing;
      
      const deliveryStreet = optimizeTextForSpace(doc, order.delivery_street, leftColumnWidth, layout.FONT_SIZES.NORMAL, language);
      doc.text(deliveryStreet, leftColumnX, addressY);
      addressY += addressLineSpacing;
      
      const deliveryCity = optimizeTextForSpace(doc, `${order.delivery_postcode} ${order.delivery_city}`, leftColumnWidth, layout.FONT_SIZES.NORMAL, language);
      doc.text(deliveryCity, leftColumnX, addressY);
    }
    
    // RIGHT COLUMN - Invoice Details - Fixed position and height
    let detailsY = layout.POSITIONS.DETAILS_Y;
    doc.setFontSize(layout.FONT_SIZES.NORMAL);
    doc.setTextColor(...layout.COLORS.PRIMARY_TEXT);
    
    const labelWidth = 35 * layout.SCALE_FACTOR;
    const valueX = rightColumnX + labelWidth;
    const maxValueWidth = contentWidth * 0.45 - labelWidth;
    
    doc.text(`${getInvoiceTranslations(language).invoiceDate}:`, rightColumnX, detailsY);
    doc.text(new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE'), valueX, detailsY);
    detailsY += 6;
    
    doc.text(`${getInvoiceTranslations(language).orderNumber}:`, rightColumnX, detailsY);
    // Use temp_order_number if available, otherwise use original order_number
    const displayOrderNumber = order.temp_order_number || order.order_number;
    const orderNum = optimizeTextForSpace(doc, displayOrderNumber, maxValueWidth, layout.FONT_SIZES.NORMAL, language);
    doc.text(orderNum, valueX, detailsY);
    detailsY += 6;
    
    doc.text(`${getInvoiceTranslations(language).orderDate}:`, rightColumnX, detailsY);
    doc.text(new Date(order.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE'), valueX, detailsY);
    
    // ITEMS TABLE - Fixed position
    const tableStartY = layout.POSITIONS.TABLE_Y;
    let currentY = tableStartY;
    
    // Table header with accent color
    doc.setFillColor(accentColor.r, accentColor.g, accentColor.b);
    doc.rect(layout.MARGIN, currentY, contentWidth, layout.SECTIONS.TABLE_HEADER_HEIGHT, 'F');
    
    doc.setFontSize(layout.FONT_SIZES.SMALL);
    doc.setTextColor(255, 255, 255);
    const headerPadding = 3 * layout.SCALE_FACTOR;
    
    doc.text(getInvoiceTranslations(language).description, layout.MARGIN + headerPadding, currentY + 6);
    doc.text(getInvoiceTranslations(language).quantity, layout.MARGIN + (contentWidth * 0.5), currentY + 6);
    doc.text(getInvoiceTranslations(language).unitPrice, layout.MARGIN + (contentWidth * 0.65), currentY + 6);
    doc.text(getInvoiceTranslations(language).total, layout.MARGIN + (contentWidth * 0.8), currentY + 6);
    
    currentY += layout.SECTIONS.TABLE_HEADER_HEIGHT;
    
    // Table content
    doc.setTextColor(...layout.COLORS.PRIMARY_TEXT);
    doc.setFontSize(layout.FONT_SIZES.SMALL);
    
    // Main product line
    doc.setFillColor(...layout.COLORS.BACKGROUND_LIGHT);
    doc.rect(layout.MARGIN, currentY, contentWidth, layout.SECTIONS.TABLE_ROW_HEIGHT, 'F');
    
    const cellPadding = 3 * layout.SCALE_FACTOR;
    const descriptionWidth = contentWidth * 0.45;
    const productDesc = optimizeTextForSpace(doc, getInvoiceTranslations(language).heatingOilDelivery, descriptionWidth, layout.FONT_SIZES.SMALL, language);
    
    doc.text(productDesc, layout.MARGIN + cellPadding, currentY + 5);
    doc.text(`${order.liters} ${getInvoiceTranslations(language).liters}`, layout.MARGIN + (contentWidth * 0.5), currentY + 5);
    doc.text(`${getInvoiceTranslations(language).currency}${order.price_per_liter.toFixed(2)}`, layout.MARGIN + (contentWidth * 0.65), currentY + 5);
    doc.text(`${getInvoiceTranslations(language).currency}${order.base_price.toFixed(2)}`, layout.MARGIN + (contentWidth * 0.8), currentY + 5);
    currentY += layout.SECTIONS.TABLE_ROW_HEIGHT + 2;
    
    // Delivery fee if applicable
    if (order.delivery_fee > 0) {
      const deliveryDesc = optimizeTextForSpace(doc, getInvoiceTranslations(language).deliveryFee, descriptionWidth, layout.FONT_SIZES.SMALL, language);
      doc.text(deliveryDesc, layout.MARGIN + cellPadding, currentY + 5);
      doc.text('1', layout.MARGIN + (contentWidth * 0.5), currentY + 5);
      doc.text(`${getInvoiceTranslations(language).currency}${order.delivery_fee.toFixed(2)}`, layout.MARGIN + (contentWidth * 0.65), currentY + 5);
      doc.text(`${getInvoiceTranslations(language).currency}${order.delivery_fee.toFixed(2)}`, layout.MARGIN + (contentWidth * 0.8), currentY + 5);
      currentY += layout.SECTIONS.TABLE_ROW_HEIGHT + 2;
    }
    
    // Table border
    doc.setDrawColor(...layout.COLORS.BORDER_LIGHT);
    doc.setLineWidth(0.5 * layout.SCALE_FACTOR);
    doc.rect(layout.MARGIN, tableStartY, contentWidth, currentY - tableStartY);
    
    // TOTALS SECTION - Fixed position relative to table
    const totalsY = currentY + layout.POSITIONS.TOTALS_Y_OFFSET;
    const totalsWidth = 64 * layout.SCALE_FACTOR;
    const totalsX = layout.MARGIN + contentWidth - totalsWidth;
    
    // Totals background
    doc.setFillColor(...layout.COLORS.BACKGROUND_GRAY);
    const totalsHeight = layout.SECTIONS.TOTALS_HEIGHT;
    doc.rect(totalsX, totalsY - 5, totalsWidth, totalsHeight, 'F');
    doc.setDrawColor(...layout.COLORS.BORDER_LIGHT);
    doc.rect(totalsX, totalsY - 5, totalsWidth, totalsHeight);
    
    doc.setFontSize(layout.FONT_SIZES.NORMAL);
    doc.setTextColor(...layout.COLORS.PRIMARY_TEXT);
    
    const totalsPadding = 3 * layout.SCALE_FACTOR;
    let totalsCurrentY = totalsY + 2;
    const totalsLineSpacing = 6 * layout.SCALE_FACTOR * layout.LANGUAGE_FACTOR.lineHeight;
    
    doc.text(`${getInvoiceTranslations(language).subtotal}:`, totalsX + totalsPadding, totalsCurrentY);
    doc.text(`${getInvoiceTranslations(language).currency}${totalWithoutVat.toFixed(2)}`, totalsX + totalsWidth - totalsPadding, totalsCurrentY, { align: 'right' });
    totalsCurrentY += totalsLineSpacing;
    
    doc.text(`${getInvoiceTranslations(language).vat} (${vatRate}%):`, totalsX + totalsPadding, totalsCurrentY);
    doc.text(`${getInvoiceTranslations(language).currency}${vatAmount.toFixed(2)}`, totalsX + totalsWidth - totalsPadding, totalsCurrentY, { align: 'right' });
    totalsCurrentY += totalsLineSpacing * 1.1; // Reduced spacing before grand total
    
    // Grand total - adjusted position
    doc.setFontSize(layout.FONT_SIZES.SECTION_HEADER);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(accentColor.r, accentColor.g, accentColor.b);
    doc.text(`${getInvoiceTranslations(language).grandTotal}:`, totalsX + totalsPadding, totalsCurrentY);
    doc.text(`${getInvoiceTranslations(language).currency}${order.total_amount.toFixed(2)}`, totalsX + totalsWidth - totalsPadding, totalsCurrentY, { align: 'right' });
    doc.setFont("helvetica", "normal");
    
    // PAYMENT DETAILS CARD - Fixed position
    if (order.shops.bank_accounts) {
      const paymentY = totalsY + totalsHeight + layout.POSITIONS.PAYMENT_Y_OFFSET;
      
      const cardHeight = layout.SECTIONS.PAYMENT_HEIGHT;
      // Header
      doc.setFillColor(accentColor.r, accentColor.g, accentColor.b);
      doc.rect(layout.MARGIN, paymentY, contentWidth, 8, 'F');
      
      doc.setFontSize(layout.FONT_SIZES.SECTION_HEADER);
      doc.setTextColor(255, 255, 255);
      doc.text(getInvoiceTranslations(language).paymentDetails, layout.MARGIN + 3, paymentY + 5);
      
      // Content area
      doc.setFillColor(...layout.COLORS.BACKGROUND_GRAY);
      doc.rect(layout.MARGIN, paymentY + 8, contentWidth, cardHeight - 8, 'F');
      doc.setDrawColor(accentColor.r, accentColor.g, accentColor.b);
      doc.rect(layout.MARGIN, paymentY, contentWidth, cardHeight);
      
      let paymentContentY = paymentY + 13;
      doc.setFontSize(layout.FONT_SIZES.SMALL);
      doc.setTextColor(...layout.COLORS.PRIMARY_TEXT);
      
      const paymentLabelWidth = 30 * layout.SCALE_FACTOR;
      const paymentPadding = 3 * layout.SCALE_FACTOR;
      const maxPaymentValueWidth = contentWidth - paymentLabelWidth - (paymentPadding * 2);
      
      // Account holder
      const accountHolderName = order.shops.bank_accounts.use_anyname 
        ? order.shops.name 
        : order.shops.bank_accounts.account_holder;
      
      doc.text(`${getInvoiceTranslations(language).accountHolder}:`, layout.MARGIN + paymentPadding, paymentContentY);
      const accountHolder = optimizeTextForSpace(doc, accountHolderName, maxPaymentValueWidth, layout.FONT_SIZES.SMALL, language);
      doc.text(accountHolder, layout.MARGIN + paymentPadding + paymentLabelWidth, paymentContentY);
      paymentContentY += 6;
      
      doc.text(`${getInvoiceTranslations(language).iban}:`, layout.MARGIN + paymentPadding, paymentContentY);
      const iban = optimizeTextForSpace(doc, order.shops.bank_accounts.iban, maxPaymentValueWidth, layout.FONT_SIZES.SMALL, language);
      doc.text(iban, layout.MARGIN + paymentPadding + paymentLabelWidth, paymentContentY);
      paymentContentY += 6;
      
      if (order.shops.bank_accounts.bic) {
        doc.text(`${getInvoiceTranslations(language).bic}:`, layout.MARGIN + paymentPadding, paymentContentY);
        const bic = optimizeTextForSpace(doc, order.shops.bank_accounts.bic, maxPaymentValueWidth, layout.FONT_SIZES.SMALL, language);
        doc.text(bic, layout.MARGIN + paymentPadding + paymentLabelWidth, paymentContentY);
        paymentContentY += 6;
      }
      
      doc.text(`${getInvoiceTranslations(language).paymentReference}:`, layout.MARGIN + paymentPadding, paymentContentY);
      // Use temp_order_number for payment reference if available
      const referenceOrderNumber = order.temp_order_number || order.order_number;
      const reference = optimizeTextForSpace(doc, referenceOrderNumber, maxPaymentValueWidth, layout.FONT_SIZES.SMALL, language);
      doc.text(reference, layout.MARGIN + paymentPadding + paymentLabelWidth, paymentContentY);
    }
    
    // FOOTER - Enhanced with text wrapping
    const footerY = layout.POSITIONS.FOOTER_Y;
    
    // Footer background
    doc.setFillColor(...layout.COLORS.BACKGROUND_LIGHT);
    doc.rect(0, footerY - 5, layout.PAGE_WIDTH, layout.SECTIONS.FOOTER_HEIGHT, 'F');
    
    // 4-column layout
    const col1X = layout.MARGIN;
    const col2X = layout.MARGIN + (contentWidth * 0.25);
    const col3X = layout.MARGIN + (contentWidth * 0.5);
    const col4X = layout.MARGIN + (contentWidth * 0.75);
    const colWidth = contentWidth * 0.22; // Slightly less than 25% for padding
    
    doc.setFontSize(layout.FONT_SIZES.FOOTER);
    doc.setTextColor(...layout.COLORS.SECONDARY_TEXT);
    const footerLineSpacing = 4 * layout.SCALE_FACTOR;
    
    // Column 1: Company name and address with wrapping
    doc.setFont("helvetica", "bold");
    const footerCompanyNameLines = wrapTextToFitWidth(doc, order.shops.company_name, colWidth, layout.FONT_SIZES.FOOTER, language);
    let footerCol1Y = footerY;
    
    for (const line of footerCompanyNameLines) {
      doc.text(line, col1X, footerCol1Y);
      footerCol1Y += footerLineSpacing;
    }
    
    doc.setFont("helvetica", "normal");
    
    const footerAddress = optimizeTextForSpace(doc, order.shops.company_address, colWidth, layout.FONT_SIZES.FOOTER, language);
    doc.text(footerAddress, col1X, footerCol1Y);
    footerCol1Y += footerLineSpacing;
    
    const footerCity = optimizeTextForSpace(doc, `${order.shops.company_postcode} ${order.shops.company_city}`, colWidth, layout.FONT_SIZES.FOOTER, language);
    doc.text(footerCity, col1X, footerCol1Y);
    
    // Column 2: Contact information
    doc.setFont("helvetica", "bold");
    doc.text('Kontakt', col2X, footerY);
    doc.setFont("helvetica", "normal");
    
    let footerCol2Y = footerY + footerLineSpacing;
    
    if (order.shops.company_phone) {
      const footerPhone = optimizeTextForSpace(doc, order.shops.company_phone, colWidth, layout.FONT_SIZES.FOOTER, language);
      doc.text(footerPhone, col2X, footerCol2Y);
      footerCol2Y += footerLineSpacing;
    }
    
    const footerEmail = optimizeTextForSpace(doc, order.shops.company_email, colWidth, layout.FONT_SIZES.FOOTER, language);
    doc.text(footerEmail, col2X, footerCol2Y);
    footerCol2Y += footerLineSpacing;
    
    if (order.shops.company_website) {
      const footerWebsite = optimizeTextForSpace(doc, order.shops.company_website, colWidth, layout.FONT_SIZES.FOOTER, language);
      doc.text(footerWebsite, col2X, footerCol2Y);
    }
    
    // Column 3: Bank information
    if (order.shops.bank_accounts) {
      doc.setFont("helvetica", "bold");
      doc.text('Bankinformationen', col3X, footerY);
      doc.setFont("helvetica", "normal");
      
      let footerCol3Y = footerY + footerLineSpacing;
      
      const accountHolderName = order.shops.bank_accounts.use_anyname 
        ? order.shops.name 
        : order.shops.bank_accounts.account_holder;
      
      const footerAccountHolder = optimizeTextForSpace(doc, accountHolderName, colWidth, layout.FONT_SIZES.FOOTER, language);
      doc.text(footerAccountHolder, col3X, footerCol3Y);
      footerCol3Y += footerLineSpacing;
      
      const footerIban = optimizeTextForSpace(doc, order.shops.bank_accounts.iban, colWidth, layout.FONT_SIZES.FOOTER, language);
      doc.text(footerIban, col3X, footerCol3Y);
      footerCol3Y += footerLineSpacing;
      
      if (order.shops.bank_accounts.bic) {
        const footerBic = optimizeTextForSpace(doc, order.shops.bank_accounts.bic, colWidth, layout.FONT_SIZES.FOOTER, language);
        doc.text(footerBic, col3X, footerCol3Y);
      }
    }
    
    // Column 4: Business owner and VAT ID
    doc.setFont("helvetica", "bold");
    doc.text('Geschäftsdaten', col4X, footerY);
    doc.setFont("helvetica", "normal");
    
    let footerCol4Y = footerY + footerLineSpacing;
    
    if (order.shops.business_owner) {
      const footerOwner = optimizeTextForSpace(doc, order.shops.business_owner, colWidth, layout.FONT_SIZES.FOOTER, language);
      doc.text(footerOwner, col4X, footerCol4Y);
      footerCol4Y += footerLineSpacing;
    }
    
    if (order.shops.vat_number) {
      const footerVat = optimizeTextForSpace(doc, order.shops.vat_number, colWidth, layout.FONT_SIZES.FOOTER, language);
      doc.text(footerVat, col4X, footerCol4Y);
    }
    
    console.log('Responsive PDF content created with text wrapping for company names, converting to bytes...');
    
    // Get PDF as array buffer
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBytes = new Uint8Array(pdfArrayBuffer);
    
    console.log('PDF conversion completed, size:', pdfBytes.length, 'bytes');
    
    return pdfBytes;
    
  } catch (error) {
    console.error('Error generating responsive PDF:', error);
    throw new Error(`Responsive PDF generation failed: ${error.message}`);
  }
}

serve(handler);
