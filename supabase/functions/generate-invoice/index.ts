
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
    currency: '€'
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
    currency: '€'
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
    currency: '€'
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
    currency: '€'
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
    currency: '€'
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
    currency: '€'
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
    currency: '€'
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
    currency: '€'
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
    currency: '€'
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
    currency: '€'
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
    currency: '€'
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
    currency: '€'
  }
};

function getInvoiceTranslations(language: string) {
  return translations[language as keyof typeof translations] || translations.de;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    doc.text(new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE'), margin + labelWidth, yPos);
    yPos += 6;
    
    doc.text(`${t.dueDate}:`, margin, yPos);
    doc.text(dueDate.toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE'), margin + labelWidth, yPos);
    yPos += 6;
    
    doc.text(`${t.orderNumber}:`, margin, yPos);
    doc.text(order.order_number, margin + labelWidth, yPos);
    yPos += 6;
    
    doc.text(`${t.orderDate}:`, margin, yPos);
    doc.text(new Date(order.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE'), margin + labelWidth, yPos);
    
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
    
    console.log('PDF content created with A4 format and language', language, ', converting to bytes...');
    
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
