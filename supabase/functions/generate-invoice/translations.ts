
export interface InvoiceTranslations {
  invoice: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerDetails: string;
  companyDetails: string;
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
  subtotal: string;
  vat: string;
  grandTotal: string;
  paymentDetails: string;
  bankDetails: string;
  accountHolder: string;
  iban: string;
  bic: string;
  paymentReference: string;
  thankYou: string;
  deliveryAddress: string;
  billingAddress: string;
  heatingOilDelivery: string;
  liters: string;
  pricePerLiter: string;
  deliveryFee: string;
  dueDays: string;
  currency: string;
  phone: string;
  email: string;
  website: string;
  paymentTerm: string;
  orderNumber: string;
  orderDate: string;
}

export const translations: Record<string, InvoiceTranslations> = {
  de: {
    invoice: 'Rechnung',
    invoiceNumber: 'Rechnungsnummer',
    invoiceDate: 'Rechnungsdatum',
    dueDate: 'Fälligkeitsdatum',
    orderNumber: 'Bestellnummer',
    orderDate: 'Bestelldatum',
    customerDetails: 'Kundendetails',
    companyDetails: 'Firmendetails',
    description: 'Beschreibung',
    quantity: 'Menge',
    unitPrice: 'Einzelpreis',
    total: 'Gesamt',
    subtotal: 'Zwischensumme',
    vat: 'MwSt',
    grandTotal: 'Gesamtbetrag',
    paymentDetails: 'Zahlungsdetails',
    bankDetails: 'Bankverbindung',
    accountHolder: 'Kontoinhaber',
    iban: 'IBAN',
    bic: 'BIC',
    paymentReference: 'Verwendungszweck',
    thankYou: 'Vielen Dank für Ihren Auftrag!',
    deliveryAddress: 'Lieferadresse',
    billingAddress: 'Rechnungsadresse',
    heatingOilDelivery: 'Heizöllieferung',
    liters: 'Liter',
    pricePerLiter: 'Preis pro Liter',
    deliveryFee: 'Liefergebühr',
    dueDays: '14 Tage',
    currency: '€',
    phone: 'Telefon',
    email: 'E-Mail',
    website: 'Website',
    paymentTerm: 'Zahlungsziel'
  },
  en: {
    invoice: 'Invoice',
    invoiceNumber: 'Invoice Number',
    invoiceDate: 'Invoice Date',
    dueDate: 'Due Date',
    orderNumber: 'Order Number',
    orderDate: 'Order Date',
    customerDetails: 'Customer Details',
    companyDetails: 'Company Details',
    description: 'Description',
    quantity: 'Quantity',
    unitPrice: 'Unit Price',
    total: 'Total',
    subtotal: 'Subtotal',
    vat: 'VAT',
    grandTotal: 'Grand Total',
    paymentDetails: 'Payment Details',
    bankDetails: 'Bank Details',
    accountHolder: 'Account Holder',
    iban: 'IBAN',
    bic: 'BIC',
    paymentReference: 'Payment Reference',
    thankYou: 'Thank you for your order!',
    deliveryAddress: 'Delivery Address',
    billingAddress: 'Billing Address',
    heatingOilDelivery: 'Heating Oil Delivery',
    liters: 'Liters',
    pricePerLiter: 'Price per Liter',
    deliveryFee: 'Delivery Fee',
    dueDays: '14 days',
    currency: '€',
    phone: 'Phone',
    email: 'Email',
    website: 'Website',
    paymentTerm: 'Payment Term'
  },
  fr: {
    invoice: 'Facture',
    invoiceNumber: 'Numéro de facture',
    invoiceDate: 'Date de facture',
    dueDate: 'Date d\'échéance',
    orderNumber: 'Numéro de commande',
    orderDate: 'Date de commande',
    customerDetails: 'Détails du client',
    companyDetails: 'Détails de l\'entreprise',
    description: 'Description',
    quantity: 'Quantité',
    unitPrice: 'Prix unitaire',
    total: 'Total',
    subtotal: 'Sous-total',
    vat: 'TVA',
    grandTotal: 'Total général',
    paymentDetails: 'Détails de paiement',
    bankDetails: 'Coordonnées bancaires',
    accountHolder: 'Titulaire du compte',
    iban: 'IBAN',
    bic: 'BIC',
    paymentReference: 'Référence de paiement',
    thankYou: 'Merci pour votre commande!',
    deliveryAddress: 'Adresse de livraison',
    billingAddress: 'Adresse de facturation',
    heatingOilDelivery: 'Livraison de fioul',
    liters: 'Litres',
    pricePerLiter: 'Prix par litre',
    deliveryFee: 'Frais de livraison',
    dueDays: '14 jours',
    currency: '€',
    phone: 'Téléphone',
    email: 'Email',
    website: 'Site web',
    paymentTerm: 'Délai de paiement'
  },
  es: {
    invoice: 'Factura',
    invoiceNumber: 'Número de factura',
    invoiceDate: 'Fecha de factura',
    dueDate: 'Fecha de vencimiento',
    orderNumber: 'Número de pedido',
    orderDate: 'Fecha de pedido',
    customerDetails: 'Detalles del cliente',
    companyDetails: 'Detalles de la empresa',
    description: 'Descripción',
    quantity: 'Cantidad',
    unitPrice: 'Precio unitario',
    total: 'Total',
    subtotal: 'Subtotal',
    vat: 'IVA',
    grandTotal: 'Total general',
    paymentDetails: 'Detalles de pago',
    bankDetails: 'Detalles bancarios',
    accountHolder: 'Titular de la cuenta',
    iban: 'IBAN',
    bic: 'BIC',
    paymentReference: 'Referencia de pago',
    thankYou: '¡Gracias por su pedido!',
    deliveryAddress: 'Dirección de entrega',
    billingAddress: 'Dirección de facturación',
    heatingOilDelivery: 'Entrega de combustible',
    liters: 'Litros',
    pricePerLiter: 'Precio por litro',
    deliveryFee: 'Tarifa de entrega',
    dueDays: '14 días',
    currency: '€',
    phone: 'Teléfono',
    email: 'Email',
    website: 'Sitio web',
    paymentTerm: 'Plazo de pago'
  },
  it: {
    invoice: 'Fattura',
    invoiceNumber: 'Numero fattura',
    invoiceDate: 'Data fattura',
    dueDate: 'Data di scadenza',
    orderNumber: 'Numero ordine',
    orderDate: 'Data ordine',
    customerDetails: 'Dettagli cliente',
    companyDetails: 'Dettagli azienda',
    description: 'Descrizione',
    quantity: 'Quantità',
    unitPrice: 'Prezzo unitario',
    total: 'Totale',
    subtotal: 'Subtotale',
    vat: 'IVA',
    grandTotal: 'Totale generale',
    paymentDetails: 'Dettagli pagamento',
    bankDetails: 'Dettagli bancari',
    accountHolder: 'Intestatario conto',
    iban: 'IBAN',
    bic: 'BIC',
    paymentReference: 'Riferimento pagamento',
    thankYou: 'Grazie per il tuo ordine!',
    deliveryAddress: 'Indirizzo di consegna',
    billingAddress: 'Indirizzo di fatturazione',
    heatingOilDelivery: 'Consegna gasolio',
    liters: 'Litri',
    pricePerLiter: 'Prezzo per litro',
    deliveryFee: 'Tassa di consegna',
    dueDays: '14 giorni',
    currency: '€',
    phone: 'Telefono',
    email: 'Email',
    website: 'Sito web',
    paymentTerm: 'Termine di pagamento'
  }
};

export function getInvoiceTranslations(language: string): InvoiceTranslations {
  return translations[language] || translations.de;
}

export function detectLanguage(order: any): string {
  // Try to detect language from various order fields
  if (order.language) {
    return order.language.toLowerCase();
  }
  
  // Check shop language
  if (order.shops?.language) {
    return order.shops.language.toLowerCase();
  }
  
  // Check country code and map to language
  const countryCode = order.shops?.country_code?.toLowerCase();
  const countryToLanguage: { [key: string]: string } = {
    'de': 'de',
    'at': 'de', // Austria
    'ch': 'de', // Switzerland (German speaking)
    'us': 'en',
    'gb': 'en',
    'ca': 'en',
    'au': 'en',
    'fr': 'fr',
    'be': 'fr', // Belgium (French speaking areas)
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
  
  // Default to German
  return 'de';
}

export function interpolateString(template: string, variables: { [key: string]: string }): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] || match;
  });
}
