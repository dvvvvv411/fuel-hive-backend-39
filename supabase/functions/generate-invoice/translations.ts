
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
  paymentInfo: string;
  recipient: string;
  bank: string;
  totalAmount: string;
  vatLabel: string;
  invoiceFilename: string;
  orderNumber?: string;
  orderDate?: string;
  phone?: string;
  email?: string;
  website?: string;
  // Footer translations
  contact: string;
  bankInformation: string;
  businessData: string;
  products: Record<string, string>;
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
    paymentInfo: 'Zahlungsinformationen',
    recipient: 'Empfänger',
    bank: 'Bank',
    totalAmount: 'Gesamtbetrag',
    vatLabel: 'USt-IdNr.',
    invoiceFilename: 'Rechnung',
    phone: 'Telefon',
    email: 'E-Mail',
    website: 'Website',
    contact: 'Kontakt',
    bankInformation: 'Bankinformationen',
    businessData: 'Geschäftsdaten',
    products: {
      'heating_oil': 'Heizöl',
      'premium_heizoel': 'Premium Heizöl',
      'standard_heizoel': 'Standard Heizöl',
      'diesel': 'Diesel',
      'gasoline': 'Benzin'
    }
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
    paymentInfo: 'Payment Information',
    recipient: 'Recipient',
    bank: 'Bank',
    totalAmount: 'Total Amount',
    vatLabel: 'VAT Number',
    invoiceFilename: 'Invoice',
    phone: 'Phone',
    email: 'Email',
    website: 'Website',
    contact: 'Contact',
    bankInformation: 'Bank Information',
    businessData: 'Business Data',
    products: {
      'heating_oil': 'Heating Oil',
      'premium_heizoel': 'Premium Heating Oil',
      'standard_heizoel': 'Standard Heating Oil',
      'diesel': 'Diesel',
      'gasoline': 'Gasoline'
    }
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
    paymentInfo: 'Informations de paiement',
    recipient: 'Destinataire',
    bank: 'Banque',
    totalAmount: 'Montant total',
    vatLabel: 'Numéro de TVA',
    invoiceFilename: 'Facture',
    phone: 'Téléphone',
    email: 'Email',
    website: 'Site web',
    contact: 'Contact',
    bankInformation: 'Informations bancaires',
    businessData: 'Données d\'entreprise',
    products: {
      'heating_oil': 'Fioul de chauffage',
      'premium_heizoel': 'Fioul premium',
      'standard_heizoel': 'Fioul standard',
      'diesel': 'Diesel',
      'gasoline': 'Essence'
    }
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
    paymentInfo: 'Información de pago',
    recipient: 'Destinatario',
    bank: 'Banco',
    totalAmount: 'Monto total',
    vatLabel: 'Número de IVA',
    invoiceFilename: 'Factura',
    phone: 'Teléfono',
    email: 'Email',
    website: 'Sitio web',
    contact: 'Contacto',
    bankInformation: 'Información bancaria',
    businessData: 'Datos empresariales',
    products: {
      'heating_oil': 'Combustible para calefacción',
      'premium_heizoel': 'Combustible premium',
      'standard_heizoel': 'Combustible estándar',
      'diesel': 'Diesel',
      'gasoline': 'Gasolina'
    }
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
    paymentInfo: 'Informazioni di pagamento',
    recipient: 'Destinatario',
    bank: 'Banca',
    totalAmount: 'Importo totale',
    vatLabel: 'Partita IVA',
    invoiceFilename: 'Fattura',
    phone: 'Telefono',
    email: 'Email',
    website: 'Sito web',
    contact: 'Contatto',
    bankInformation: 'Informazioni bancarie',
    businessData: 'Dati aziendali',
    products: {
      'heating_oil': 'Gasolio per riscaldamento',
      'premium_heizoel': 'Gasolio premium',
      'standard_heizoel': 'Gasolio standard',
      'diesel': 'Diesel',
      'gasoline': 'Benzina'
    }
  },
  pl: {
    invoice: 'Faktura',
    invoiceNumber: 'Numer faktury',
    invoiceDate: 'Data faktury',
    dueDate: 'Termin płatności',
    orderNumber: 'Numer zamówienia',
    orderDate: 'Data zamówienia',
    customerDetails: 'Dane klienta',
    companyDetails: 'Dane firmy',
    description: 'Opis',
    quantity: 'Ilość',
    unitPrice: 'Cena jednostkowa',
    total: 'Razem',
    subtotal: 'Suma częściowa',
    vat: 'VAT',
    grandTotal: 'Suma całkowita',
    paymentDetails: 'Szczegóły płatności',
    bankDetails: 'Dane bankowe',
    accountHolder: 'Właściciel konta',
    iban: 'IBAN',
    bic: 'BIC',
    paymentReference: 'Tytuł płatności',
    thankYou: 'Dziękujemy za zamówienie!',
    deliveryAddress: 'Adres dostawy',
    billingAddress: 'Adres rozliczeniowy',
    heatingOilDelivery: 'Dostawa oleju opałowego',
    liters: 'Litry',
    pricePerLiter: 'Cena za litr',
    deliveryFee: 'Opłata za dostawę',
    dueDays: '14 dni',
    currency: '€',
    paymentInfo: 'Informacje o płatności',
    recipient: 'Odbiorca',
    bank: 'Bank',
    totalAmount: 'Kwota całkowita',
    vatLabel: 'NIP',
    invoiceFilename: 'Faktura',
    phone: 'Telefon',
    email: 'Email',
    website: 'Strona internetowa',
    contact: 'Kontakt',
    bankInformation: 'Informacje bankowe',
    businessData: 'Dane biznesowe',
    products: {
      'heating_oil': 'Olej opałowy',
      'premium_heizoel': 'Olej opałowy premium',
      'standard_heizoel': 'Olej opałowy standardowy',
      'diesel': 'Diesel',
      'gasoline': 'Benzyna'
    }
  },
  nl: {
    invoice: 'Factuur',
    invoiceNumber: 'Factuurnummer',
    invoiceDate: 'Factuurdatum',
    dueDate: 'Vervaldatum',
    orderNumber: 'Bestelnummer',
    orderDate: 'Besteldatum',
    customerDetails: 'Klantgegevens',
    companyDetails: 'Bedrijfsgegevens',
    description: 'Beschrijving',
    quantity: 'Hoeveelheid',
    unitPrice: 'Eenheidsprijs',
    total: 'Totaal',
    subtotal: 'Subtotaal',
    vat: 'BTW',
    grandTotal: 'Eindtotaal',
    paymentDetails: 'Betalingsgegevens',
    bankDetails: 'Bankgegevens',
    accountHolder: 'Rekeninghouder',
    iban: 'IBAN',
    bic: 'BIC',
    paymentReference: 'Betalingskenmerk',
    thankYou: 'Dank u voor uw bestelling!',
    deliveryAddress: 'Leveringsadres',
    billingAddress: 'Factuuradres',
    heatingOilDelivery: 'Stookolielevering',
    liters: 'Liters',
    pricePerLiter: 'Prijs per liter',
    deliveryFee: 'Leveringskosten',
    dueDays: '14 dagen',
    currency: '€',
    paymentInfo: 'Betalingsinformatie',
    recipient: 'Ontvanger',
    bank: 'Bank',
    totalAmount: 'Totaalbedrag',
    vatLabel: 'BTW-nummer',
    invoiceFilename: 'Factuur',
    phone: 'Telefoon',
    email: 'Email',
    website: 'Website',
    contact: 'Contact',
    bankInformation: 'Bankinformatie',
    businessData: 'Bedrijfsgegevens',
    products: {
      'heating_oil': 'Stookolie',
      'premium_heizoel': 'Premium stookolie',
      'standard_heizoel': 'Standaard stookolie',
      'diesel': 'Diesel',
      'gasoline': 'Benzine'
    }
  }
};

export function getTranslations(language: string): InvoiceTranslations {
  return translations[language] || translations.de;
}

export function detectLanguage(order: any): string {
  console.log('Detecting language for order from shop country/language...');
  
  // Priority 1: Use shop's configured language
  if (order.shops?.language) {
    console.log('Using shop configured language:', order.shops.language);
    return order.shops.language;
  }
  
  // Priority 2: Use country code to determine language
  if (order.shops?.country_code) {
    const countryLanguageMap: Record<string, string> = {
      'DE': 'de',
      'AT': 'de', 
      'CH': 'de',
      'US': 'en',
      'GB': 'en',
      'CA': 'en',
      'AU': 'en',
      'FR': 'fr',
      'BE': 'fr', // Belgium can be French or Dutch, defaulting to French
      'ES': 'es',
      'IT': 'it',
      'PL': 'pl',
      'NL': 'nl'
    };
    
    const detectedLanguage = countryLanguageMap[order.shops.country_code] || 'de';
    console.log(`Country code ${order.shops.country_code} mapped to language: ${detectedLanguage}`);
    return detectedLanguage;
  }
  
  // Fallback to German
  console.log('No language detection criteria found, falling back to German');
  return 'de';
}
