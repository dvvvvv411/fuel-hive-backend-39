
export interface EmailTranslations {
  // Confirmation email
  orderConfirmed: string;
  greeting: (firstName: string, lastName: string) => string;
  thanks: string;
  orderDetails: string;
  orderNumber: string;
  product: string;
  quantity: string;
  liters: string;
  pricePerLiter: string;
  deliveryFee: string;
  totalAmount: string;
  deliveryAddress: string;
  orderProcessedAutomatically: string;
  contactText: string;
  regards: string;
  
  // Invoice email
  invoiceAttached: string;
  invoiceInPdf: string;
  paymentInfo: string;
  invoiceAmount: string;
  recipient: string;
  bank: string;
  paymentReference: string;
  paymentNote: (invoiceNumber: string, recipientName: string) => string;
  invoiceDetails: string;
  invoiceDate: string;
  pdfAttachmentNotice: string;
  invoiceContactText: string;
  thankYouTrust: string;
  
  // Common
  vatLabel: string;
  
  // Subjects
  confirmationSubject: string;
  invoiceSubject: string;
}

// Product translations mapping
export const productTranslations: Record<string, Record<string, string>> = {
  'standard': {
    de: 'Standard Heizöl',
    en: 'Standard Heating Oil',
    fr: 'Fioul Standard',
    es: 'Gasóleo Estándar',
    it: 'Gasolio Standard'
  },
  'premium': {
    de: 'Premium Heizöl',
    en: 'Premium Heating Oil',
    fr: 'Fioul Premium',
    es: 'Gasóleo Premium',
    it: 'Gasolio Premium'
  }
};

const emailTranslations: Record<string, EmailTranslations> = {
  de: {
    // Confirmation email
    orderConfirmed: 'Bestellung bestätigt',
    greeting: (firstName: string, lastName: string) => `Liebe/r ${firstName} ${lastName},`,
    thanks: 'vielen Dank für Ihre Bestellung von {product}. Ihre Bestellung wurde erfolgreich verarbeitet.',
    orderDetails: 'Bestelldetails',
    orderNumber: 'Bestellnummer',
    product: 'Produkt',
    quantity: 'Menge',
    liters: 'Liter',
    pricePerLiter: 'Preis pro Liter',
    deliveryFee: 'Liefergebühr',
    totalAmount: 'Gesamtbetrag',
    deliveryAddress: 'Lieferadresse',
    orderProcessedAutomatically: 'Ihre Bestellung wurde automatisch verarbeitet und bestätigt.',
    contactText: 'Bei Fragen können Sie uns gerne kontaktieren unter',
    regards: 'Mit freundlichen Grüßen',
    
    // Invoice email
    invoiceAttached: 'Rechnung im Anhang',
    invoiceInPdf: 'Anbei finden Sie die Rechnung für Ihre {product} Bestellung als PDF-Datei.',
    paymentInfo: 'Zahlungsinformationen',
    invoiceAmount: 'Rechnungsbetrag',
    recipient: 'Empfänger',
    bank: 'Bank',
    paymentReference: 'Verwendungszweck',
    paymentNote: (invoiceNumber: string, recipientName: string) => `Bitte verwenden Sie die Rechnungsnummer "${invoiceNumber}" als Verwendungszweck und überweisen Sie den Betrag an "${recipientName}".`,
    invoiceDetails: 'Rechnungsdetails',
    invoiceDate: 'Rechnungsdatum',
    pdfAttachmentNotice: '📎 Die vollständige Rechnung finden Sie als PDF-Datei im Anhang dieser E-Mail.',
    invoiceContactText: 'Bei Fragen zur Rechnung können Sie uns gerne kontaktieren unter',
    thankYouTrust: 'Vielen Dank für Ihr Vertrauen!',
    
    // Common
    vatLabel: 'USt-IdNr:',
    
    // Subjects
    confirmationSubject: 'Bestellbestätigung #{orderNumber} - {product} von {shopName}',
    invoiceSubject: 'Rechnung von {shopName}'
  },
  
  en: {
    // Confirmation email
    orderConfirmed: 'Order Confirmed',
    greeting: (firstName: string, lastName: string) => `Dear ${firstName} ${lastName},`,
    thanks: 'thank you for your order of {product}. Your order has been successfully processed.',
    orderDetails: 'Order Details',
    orderNumber: 'Order Number',
    product: 'Product',
    quantity: 'Quantity',
    liters: 'Liters',
    pricePerLiter: 'Price per Liter',
    deliveryFee: 'Delivery Fee',
    totalAmount: 'Total Amount',
    deliveryAddress: 'Delivery Address',
    orderProcessedAutomatically: 'Your order has been automatically processed and confirmed.',
    contactText: 'If you have any questions, please contact us at',
    regards: 'Best regards',
    
    // Invoice email
    invoiceAttached: 'Invoice Attached',
    invoiceInPdf: 'Please find attached the invoice for your {product} order as a PDF file.',
    paymentInfo: 'Payment Information',
    invoiceAmount: 'Invoice Amount',
    recipient: 'Recipient',
    bank: 'Bank',
    paymentReference: 'Payment Reference',
    paymentNote: (invoiceNumber: string, recipientName: string) => `Please use invoice number "${invoiceNumber}" as payment reference and transfer the amount to "${recipientName}".`,
    invoiceDetails: 'Invoice Details',
    invoiceDate: 'Invoice Date',
    pdfAttachmentNotice: '📎 The complete invoice can be found as a PDF file attached to this email.',
    invoiceContactText: 'If you have any questions about the invoice, please contact us at',
    thankYouTrust: 'Thank you for your trust!',
    
    // Common
    vatLabel: 'VAT ID:',
    
    // Subjects
    confirmationSubject: 'Order Confirmation #{orderNumber} - {product} from {shopName}',
    invoiceSubject: 'Invoice from {shopName}'
  },
  
  fr: {
    // Confirmation email
    orderConfirmed: 'Commande confirmée',
    greeting: (firstName: string, lastName: string) => `Cher/Chère ${firstName} ${lastName},`,
    thanks: 'merci pour votre commande de {product}. Votre commande a été traitée avec succès.',
    orderDetails: 'Détails de la commande',
    orderNumber: 'Numéro de commande',
    product: 'Produit',
    quantity: 'Quantité',
    liters: 'Litres',
    pricePerLiter: 'Prix par litre',
    deliveryFee: 'Frais de livraison',
    totalAmount: 'Montant total',
    deliveryAddress: 'Adresse de livraison',
    orderProcessedAutomatically: 'Votre commande a été automatiquement traitée et confirmée.',
    contactText: 'Si vous avez des questions, n\'hésitez pas à nous contacter à',
    regards: 'Cordialement',
    
    // Invoice email
    invoiceAttached: 'Facture en pièce jointe',
    invoiceInPdf: 'Veuillez trouver ci-joint la facture pour votre commande de {product} en format PDF.',
    paymentInfo: 'Informations de paiement',
    invoiceAmount: 'Montant de la facture',
    recipient: 'Bénéficiaire',
    bank: 'Banque',
    paymentReference: 'Référence de paiement',
    paymentNote: (invoiceNumber: string, recipientName: string) => `Veuillez utiliser le numéro de facture "${invoiceNumber}" comme référence de paiement et virer le montant à "${recipientName}".`,
    invoiceDetails: 'Détails de la facture',
    invoiceDate: 'Date de facturation',
    pdfAttachmentNotice: '📎 La facture complète se trouve en pièce jointe de cet email au format PDF.',
    invoiceContactText: 'Si vous avez des questions concernant la facture, n\'hésitez pas à nous contacter à',
    thankYouTrust: 'Merci pour votre confiance!',
    
    // Common
    vatLabel: 'N° TVA:',
    
    // Subjects
    confirmationSubject: 'Confirmation de commande #{orderNumber} - {product} de {shopName}',
    invoiceSubject: 'Facture de {shopName}'
  },
  
  es: {
    // Confirmation email
    orderConfirmed: 'Pedido confirmado',
    greeting: (firstName: string, lastName: string) => `Estimado/a ${firstName} ${lastName},`,
    thanks: 'gracias por su pedido de {product}. Su pedido ha sido procesado exitosamente.',
    orderDetails: 'Detalles del pedido',
    orderNumber: 'Número de pedido',
    product: 'Producto',
    quantity: 'Cantidad',
    liters: 'Litros',
    pricePerLiter: 'Precio por litro',
    deliveryFee: 'Tarifa de entrega',
    totalAmount: 'Importe total',
    deliveryAddress: 'Dirección de entrega',
    orderProcessedAutomatically: 'Su pedido ha sido procesado y confirmado automáticamente.',
    contactText: 'Si tiene alguna pregunta, puede contactarnos en',
    regards: 'Saludos cordiales',
    
    // Invoice email
    invoiceAttached: 'Factura adjunta',
    invoiceInPdf: 'Adjunto encontrará la factura de su pedido de {product} en formato PDF.',
    paymentInfo: 'Información de pago',
    invoiceAmount: 'Importe de la factura',
    recipient: 'Beneficiario',
    bank: 'Banco',
    paymentReference: 'Referencia de pago',
    paymentNote: (invoiceNumber: string, recipientName: string) => `Por favor use el número de factura "${invoiceNumber}" como referencia de pago y transfiera el importe a "${recipientName}".`,
    invoiceDetails: 'Detalles de la factura',
    invoiceDate: 'Fecha de factura',
    pdfAttachmentNotice: '📎 La factura completa se encuentra adjunta a este email en formato PDF.',
    invoiceContactText: 'Si tiene preguntas sobre la factura, puede contactarnos en',
    thankYouTrust: '¡Gracias por su confianza!',
    
    // Common
    vatLabel: 'NIF:',
    
    // Subjects
    confirmationSubject: 'Confirmación de pedido #{orderNumber} - {product} de {shopName}',
    invoiceSubject: 'Factura de {shopName}'
  },
  
  it: {
    // Confirmation email
    orderConfirmed: 'Ordine confermato',
    greeting: (firstName: string, lastName: string) => `Gentile ${firstName} ${lastName},`,
    thanks: 'grazie per il suo ordine di {product}. Il suo ordine è stato elaborato con successo.',
    orderDetails: 'Dettagli ordine',
    orderNumber: 'Numero ordine',
    product: 'Prodotto',
    quantity: 'Quantità',
    liters: 'Litri',
    pricePerLiter: 'Prezzo per litro',
    deliveryFee: 'Costo di consegna',
    totalAmount: 'Importo totale',
    deliveryAddress: 'Indirizzo di consegna',
    orderProcessedAutomatically: 'Il suo ordine è stato elaborato e confermato automaticamente.',
    contactText: 'Per qualsiasi domanda può contattarci a',
    regards: 'Cordiali saluti',
    
    // Invoice email
    invoiceAttached: 'Fattura allegata',
    invoiceInPdf: 'In allegato trova la fattura per il suo ordine di {product} in formato PDF.',
    paymentInfo: 'Informazioni pagamento',
    invoiceAmount: 'Importo fattura',
    recipient: 'Beneficiario',
    bank: 'Banca',
    paymentReference: 'Riferimento pagamento',
    paymentNote: (invoiceNumber: string, recipientName: string) => `La preghiamo di utilizzare il numero fattura "${invoiceNumber}" come riferimento pagamento e trasferire l'importo a "${recipientName}".`,
    invoiceDetails: 'Dettagli fattura',
    invoiceDate: 'Data fattura',
    pdfAttachmentNotice: '📎 La fattura completa si trova allegata a questa email in formato PDF.',
    invoiceContactText: 'Per domande sulla fattura può contattarci a',
    thankYouTrust: 'Grazie per la fiducia!',
    
    // Common
    vatLabel: 'P.IVA:',
    
    // Subjects
    confirmationSubject: 'Conferma ordine #{orderNumber} - {product} da {shopName}',
    invoiceSubject: 'Fattura da {shopName}'
  }
};

export function getTranslations(language: string): EmailTranslations {
  return emailTranslations[language] || emailTranslations.de;
}

export function detectLanguage(order: any): string {
  // First check if shop has a specific language setting
  if (order.shops?.language) {
    return order.shops.language;
  }
  
  // Then check if shop has a country code we can map to a language
  if (order.shops?.country_code) {
    const countryLanguageMap: Record<string, string> = {
      'DE': 'de',
      'AT': 'de',
      'CH': 'de',
      'US': 'en',
      'GB': 'en',
      'AU': 'en',
      'CA': 'en',
      'FR': 'fr',
      'BE': 'fr',
      'ES': 'es',
      'MX': 'es',
      'IT': 'it',
    };
    
    if (countryLanguageMap[order.shops.country_code]) {
      return countryLanguageMap[order.shops.country_code];
    }
  }
  
  // Default to German
  return 'de';
}

export function interpolateString(template: string, variables: Record<string, any>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

export function getProductTranslation(product: string, language: string): string {
  const productKey = product.toLowerCase();
  return productTranslations[productKey]?.[language] || productTranslations[productKey]?.['de'] || product;
}
