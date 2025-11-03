
// Email translations for order confirmation and invoice emails
export interface EmailTranslations {
  // Email subjects
  confirmationSubject: string;
  invoiceSubject: string;
  
  // Common elements
  greeting: (firstName: string, lastName: string) => string;
  thanks: string;
  regards: string;
  
  // Order confirmation email
  orderConfirmed: string;
  orderProcessedAutomatically: string;
  orderDetails: string;
  deliveryAddress: string;
  statusLabel: string;
  invoiceSeparately: string;
  
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
  thankYouTrust: string;
  
  // Order fields
  orderNumber: string;
  product: string;
  quantity: string;
  pricePerLiter: string;
  deliveryFee: string;
  totalAmount: string;
  
  // Contact text
  contactText: string;
  invoiceContactText: string;
  
  // VAT label
  vatLabel: string;
  
  // Unit labels
  liters: string;
  
  // Invoice filename
  invoiceFilename: string;
  
  // Product translations
  products: {
    [key: string]: string;
  };
  
  // Manager thank you section
  managerThanks: string;
  managerSignature: string;
  managerTitle: string;
}

const translations: { [key: string]: EmailTranslations } = {
  de: {
    confirmationSubject: "Bestellbestätigung {orderNumber} - Ihre {product}-Bestellung bei {shopName}",
    invoiceSubject: "Ihre Rechnung - Heizöl-Bestellung bei {shopName}",
    
    greeting: (firstName: string, lastName: string) => `Liebe/r ${firstName} ${lastName},`,
    thanks: "vielen Dank für Ihre Bestellung! Ihre {product}-Bestellung wurde erfolgreich aufgegeben und wird automatisch bearbeitet.",
    regards: "Mit freundlichen Grüßen",
    
    orderConfirmed: "✓ Bestellung bestätigt!",
    orderProcessedAutomatically: "🎉 Status: Ihre Bestellung wird automatisch bearbeitet. Die Rechnung wird separat per E-Mail versendet.",
    orderDetails: "📋 Ihre Bestelldetails",
    deliveryAddress: "🚚 Lieferadresse",
    statusLabel: "Status:",
    invoiceSeparately: "Die Rechnung wird separat per E-Mail versendet.",
    
    invoiceAttached: "📄 Ihre Rechnung",
    invoiceInPdf: "anbei erhalten Sie die Rechnung für Ihre {product}-Bestellung. Die Rechnung finden Sie als PDF-Anhang in dieser E-Mail.",
    paymentInfo: "💳 Zahlungsinformationen",
    invoiceAmount: "Rechnungsbetrag:",
    recipient: "Empfänger:",
    bank: "Bank:",
    paymentReference: "Verwendungszweck:",
    paymentNote: (invoiceNumber: string, recipientName: string) => 
      `💡 Bitte verwenden Sie unbedingt die Rechnungsnummer "${invoiceNumber}" als Verwendungszweck und den Empfängernamen "${recipientName}" bei der Überweisung.`,
    invoiceDetails: "📋 Rechnungsdetails",
    invoiceDate: "Rechnungsdatum:",
    pdfAttachmentNotice: "📎 Die vollständige Rechnung finden Sie als PDF-Datei im Anhang dieser E-Mail.",
    thankYouTrust: "Vielen Dank für Ihr Vertrauen!",
    
    orderNumber: "Bestellnummer:",
    product: "Produkt:",
    quantity: "Menge:",
    pricePerLiter: "Preis pro Liter:",
    deliveryFee: "Liefergebühr:",
    totalAmount: "Gesamtbetrag:",
    
    contactText: "Bei Fragen kontaktieren Sie uns gerne unter",
    invoiceContactText: "Bei Fragen zu Ihrer Rechnung kontaktieren Sie uns gerne unter",
    
    vatLabel: "USt-IdNr:",
    
    liters: "Liter",
    
    invoiceFilename: "Rechnung",
    
    products: {
      'heating_oil': 'Heizöl',
      'diesel': 'Diesel',
      'premium_heating_oil': 'Premium Heizöl',
      'bio_heating_oil': 'Bio Heizöl',
      'heating_oil_standard': 'Heizöl Standard',
      'heating_oil_premium': 'Heizöl Premium',
      'heating_oil_bio': 'Heizöl Bio',
      'standard_heizoel': 'Standard Heizöl'
    },
    
    managerThanks: 'Ich möchte mich persönlich für Ihr Vertrauen bedanken!',
    managerSignature: 'Mit freundlichen Grüßen',
    managerTitle: 'Geschäftsführer'
  },
  
  en: {
    confirmationSubject: "Order Confirmation {orderNumber} - Your {product} Order at {shopName}",
    invoiceSubject: "Your Invoice - Heating Oil Order at {shopName}",
    
    greeting: (firstName: string, lastName: string) => `Dear ${firstName} ${lastName},`,
    thanks: "thank you for your order! Your {product} order has been successfully placed and will be processed automatically.",
    regards: "Best regards",
    
    orderConfirmed: "✓ Order confirmed!",
    orderProcessedAutomatically: "🎉 Status: Your order is being processed automatically. The invoice will be sent separately by email.",
    orderDetails: "📋 Your Order Details",
    deliveryAddress: "🚚 Delivery Address",
    statusLabel: "Status:",
    invoiceSeparately: "The invoice will be sent separately by email.",
    
    invoiceAttached: "📄 Your Invoice",
    invoiceInPdf: "please find attached the invoice for your {product} order. You can find the invoice as a PDF attachment in this email.",
    paymentInfo: "💳 Payment Information",
    invoiceAmount: "Invoice Amount:",
    recipient: "Recipient:",
    bank: "Bank:",
    paymentReference: "Payment Reference:",
    paymentNote: (invoiceNumber: string, recipientName: string) => 
      `💡 Please make sure to use the invoice number "${invoiceNumber}" as payment reference and the recipient name "${recipientName}" for the transfer.`,
    invoiceDetails: "📋 Invoice Details",
    invoiceDate: "Invoice Date:",
    pdfAttachmentNotice: "📎 You can find the complete invoice as a PDF file attached to this email.",
    thankYouTrust: "Thank you for your trust!",
    
    orderNumber: "Order Number:",
    product: "Product:",
    quantity: "Quantity:",
    pricePerLiter: "Price per Liter:",
    deliveryFee: "Delivery Fee:",
    totalAmount: "Total Amount:",
    
    contactText: "If you have any questions, please contact us at",
    invoiceContactText: "If you have any questions about your invoice, please contact us at",
    
    vatLabel: "VAT ID:",
    
    liters: "Liters",
    
    invoiceFilename: "Invoice",
    
    products: {
      'heating_oil': 'Heating Oil',
      'diesel': 'Diesel',
      'premium_heating_oil': 'Premium Heating Oil',
      'bio_heating_oil': 'Bio Heating Oil',
      'heating_oil_standard': 'Standard Heating Oil',
      'heating_oil_premium': 'Premium Heating Oil',
      'heating_oil_bio': 'Bio Heating Oil',
      'standard_heizoel': 'Standard Heating Oil'
    },
    
    managerThanks: 'I would like to personally thank you for your trust!',
    managerSignature: 'Kind regards',
    managerTitle: 'Managing Director'
  },
  
  fr: {
    confirmationSubject: "Confirmation de commande {orderNumber} - Votre commande {product} chez {shopName}",
    invoiceSubject: "Votre facture - Commande de fioul chez {shopName}",
    
    greeting: (firstName: string, lastName: string) => `Cher/Chère ${firstName} ${lastName},`,
    thanks: "merci pour votre commande ! Votre commande {product} a été passée avec succès et sera traitée automatiquement.",
    regards: "Cordialement",
    
    orderConfirmed: "✓ Commande confirmée !",
    orderProcessedAutomatically: "🎉 Statut : Votre commande est en cours de traitement automatique. La facture sera envoyée séparément par email.",
    orderDetails: "📋 Détails de votre commande",
    deliveryAddress: "🚚 Adresse de livraison",
    statusLabel: "Statut :",
    invoiceSeparately: "La facture sera envoyée séparément par email.",
    
    invoiceAttached: "📄 Votre facture",
    invoiceInPdf: "veuillez trouver ci-joint la facture pour votre commande {product}. Vous trouverez la facture en pièce jointe PDF dans cet email.",
    paymentInfo: "💳 Informations de paiement",
    invoiceAmount: "Montant de la facture :",
    recipient: "Bénéficiaire :",
    bank: "Banque :",
    paymentReference: "Référence de paiement :",
    paymentNote: (invoiceNumber: string, recipientName: string) => 
      `💡 Veuillez utiliser impérativement le numéro de facture "${invoiceNumber}" comme référence de paiement et le nom du bénéficiaire "${recipientName}" pour le virement.`,
    invoiceDetails: "📋 Détails de la facture",
    invoiceDate: "Date de facture :",
    pdfAttachmentNotice: "📎 Vous trouverez la facture complète en tant que fichier PDF en pièce jointe de cet email.",
    thankYouTrust: "Merci pour votre confiance !",
    
    orderNumber: "Numéro de commande :",
    product: "Produit :",
    quantity: "Quantité :",
    pricePerLiter: "Prix par litre :",
    deliveryFee: "Frais de livraison :",
    totalAmount: "Montant total :",
    
    contactText: "Pour toute question, contactez-nous à",
    invoiceContactText: "Pour toute question concernant votre facture, contactez-nous à",
    
    vatLabel: "N° TVA :",
    
    liters: "Litres",
    
    invoiceFilename: "Facture",
    
    products: {
      'heating_oil': 'Fioul domestique',
      'diesel': 'Diesel',
      'premium_heating_oil': 'Fioul premium',
      'bio_heating_oil': 'Bio fioul',
      'heating_oil_standard': 'Fioul standard',
      'heating_oil_premium': 'Fioul premium',
      'heating_oil_bio': 'Bio fioul',
      'standard_heizoel': 'Fioul standard'
    },
    
    managerThanks: 'Je voudrais vous remercier personnellement pour votre confiance !',
    managerSignature: 'Cordialement',
    managerTitle: 'Directeur Général'
  },
  
  it: {
    confirmationSubject: "Conferma ordine {orderNumber} - Il tuo ordine {product} presso {shopName}",
    invoiceSubject: "La tua fattura - Ordine gasolio presso {shopName}",
    
    greeting: (firstName: string, lastName: string) => `Gentile ${firstName} ${lastName},`,
    thanks: "grazie per il tuo ordine! Il tuo ordine {product} è stato effettuato con successo e sarà elaborato automaticamente.",
    regards: "Cordiali saluti",
    
    orderConfirmed: "✓ Ordine confermato!",
    orderProcessedAutomatically: "🎉 Stato: Il tuo ordine viene elaborato automaticamente. La fattura sarà inviata separatamente via email.",
    orderDetails: "📋 Dettagli del tuo ordine",
    deliveryAddress: "🚚 Indirizzo di consegna",
    statusLabel: "Stato:",
    invoiceSeparately: "La fattura sarà inviata separatamente via email.",
    
    invoiceAttached: "📄 La tua fattura",
    invoiceInPdf: "trova in allegato la fattura per il tuo ordine {product}. Puoi trovare la fattura come allegato PDF in questa email.",
    paymentInfo: "💳 Informazioni di pagamento",
    invoiceAmount: "Importo fattura:",
    recipient: "Beneficiario:",
    bank: "Banca:",
    paymentReference: "Causale:",
    paymentNote: (invoiceNumber: string, recipientName: string) => 
      `💡 Assicurati di utilizzare il numero di fattura "${invoiceNumber}" come causale e il nome del beneficiario "${recipientName}" per il bonifico.`,
    invoiceDetails: "📋 Dettagli fattura",
    invoiceDate: "Data fattura:",
    pdfAttachmentNotice: "📎 Puoi trovare la fattura completa come file PDF allegato a questa email.",
    thankYouTrust: "Grazie per la tua fiducia!",
    
    orderNumber: "Numero ordine:",
    product: "Prodotto:",
    quantity: "Quantità:",
    pricePerLiter: "Prezzo per litro:",
    deliveryFee: "Spese di consegna:",
    totalAmount: "Importo totale:",
    
    contactText: "Per domande, contattaci a",
    invoiceContactText: "Per domande sulla tua fattura, contattaci a",
    
    vatLabel: "P.IVA:",
    
    liters: "Litri",
    
    invoiceFilename: "Fattura",
    
    products: {
      'heating_oil': 'Gasolio da riscaldamento',
      'diesel': 'Diesel',
      'premium_heating_oil': 'Gasolio premium',
      'bio_heating_oil': 'Bio gasolio',
      'heating_oil_standard': 'Gasolio standard',
      'heating_oil_premium': 'Gasolio premium',
      'heating_oil_bio': 'Bio gasolio',
      'standard_heizoel': 'Gasolio standard'
    },
    
    managerThanks: 'Vorrei ringraziarla personalmente per la sua fiducia!',
    managerSignature: 'Cordiali saluti',
    managerTitle: 'Amministratore Delegato'
  },
  
  es: {
    confirmationSubject: "Confirmación de pedido {orderNumber} - Tu pedido {product} en {shopName}",
    invoiceSubject: "Tu factura - Pedido de gasóleo en {shopName}",
    
    greeting: (firstName: string, lastName: string) => `Estimado/a ${firstName} ${lastName},`,
    thanks: "¡gracias por tu pedido! Tu pedido {product} se ha realizado con éxito y será procesado automáticamente.",
    regards: "Saludos cordiales",
    
    orderConfirmed: "✓ ¡Pedido confirmado!",
    orderProcessedAutomatically: "🎉 Estado: Tu pedido está siendo procesado automáticamente. La factura se enviará por separado por email.",
    orderDetails: "📋 Detalles de tu pedido",
    deliveryAddress: "🚚 Dirección de entrega",
    statusLabel: "Estado:",
    invoiceSeparately: "La factura se enviará por separado por email.",
    
    invoiceAttached: "📄 Tu factura",
    invoiceInPdf: "encuentra adjunta la factura de tu pedido {product}. Puedes encontrar la factura como archivo PDF adjunto en este email.",
    paymentInfo: "💳 Información de pago",
    invoiceAmount: "Importe de la factura:",
    recipient: "Beneficiario:",
    bank: "Banco:",
    paymentReference: "Concepto:",
    paymentNote: (invoiceNumber: string, recipientName: string) => 
      `💡 Asegúrate de usar el número de factura "${invoiceNumber}" como concepto y el nombre del beneficiario "${recipientName}" para la transferencia.`,
    invoiceDetails: "📋 Detalles de la factura",
    invoiceDate: "Fecha de factura:",
    pdfAttachmentNotice: "📎 Puedes encontrar la factura completa como archivo PDF adjunto a este email.",
    thankYouTrust: "¡Gracias por tu confianza!",
    
    orderNumber: "Número de pedido:",
    product: "Producto:",
    quantity: "Cantidad:",
    pricePerLiter: "Precio por litro:",
    deliveryFee: "Gastos de envío:",
    totalAmount: "Importe total:",
    
    contactText: "Para preguntas, contáctanos en",
    invoiceContactText: "Para preguntas sobre tu factura, contáctanos en",
    
    vatLabel: "CIF:",
    
    liters: "Litros",
    
    invoiceFilename: "Factura",
    
    products: {
      'heating_oil': 'Gasóleo de calefacción',
      'diesel': 'Diésel',
      'premium_heating_oil': 'Gasóleo premium',
      'bio_heating_oil': 'Bio gasóleo',
      'heating_oil_standard': 'Gasóleo estándar',
      'heating_oil_premium': 'Gasóleo premium',
      'heating_oil_bio': 'Bio gasóleo',
      'standard_heizoel': 'Gasóleo estándar'
    },
    
    managerThanks: '¡Quisiera agradecerle personalmente por su confianza!',
    managerSignature: 'Saludos cordiales',
    managerTitle: 'Director General'
  },
  
  pl: {
    confirmationSubject: "Potwierdzenie zamówienia {orderNumber} - Twoje zamówienie {product} w {shopName}",
    invoiceSubject: "Twoja faktura - Zamówienie oleju opałowego w {shopName}",
    
    greeting: (firstName: string, lastName: string) => `Szanowny/a ${firstName} ${lastName},`,
    thanks: "dziękujemy za zamówienie! Twoje zamówienie {product} zostało złożone pomyślnie i będzie przetwarzane automatycznie.",
    regards: "Z poważaniem",
    
    orderConfirmed: "✓ Zamówienie potwierdzone!",
    orderProcessedAutomatically: "🎉 Status: Twoje zamówienie jest przetwarzane automatycznie. Faktura zostanie wysłana osobno e-mailem.",
    orderDetails: "📋 Szczegóły zamówienia",
    deliveryAddress: "🚚 Adres dostawy",
    statusLabel: "Status:",
    invoiceSeparately: "Faktura zostanie wysłana osobno e-mailem.",
    
    invoiceAttached: "📄 Twoja faktura",
    invoiceInPdf: "w załączniku znajdziesz fakturę za zamówienie {product}. Fakturę znajdziesz jako załącznik PDF w tej wiadomości e-mail.",
    paymentInfo: "💳 Informacje o płatności",
    invoiceAmount: "Kwota faktury:",
    recipient: "Odbiorca:",
    bank: "Bank:",
    paymentReference: "Tytuł przelewu:",
    paymentNote: (invoiceNumber: string, recipientName: string) => 
      `💡 Koniecznie użyj numeru faktury "${invoiceNumber}" jako tytułu przelewu i nazwy odbiorcy "${recipientName}" przy przelewie.`,
    invoiceDetails: "📋 Szczegóły faktury",
    invoiceDate: "Data faktury:",
    pdfAttachmentNotice: "📎 Kompletną fakturę znajdziesz jako plik PDF w załączniku do tej wiadomości e-mail.",
    thankYouTrust: "Dziękujemy za zaufanie!",
    
    orderNumber: "Numer zamówienia:",
    product: "Produkt:",
    quantity: "Ilość:",
    pricePerLiter: "Cena za litr:",
    deliveryFee: "Opłata za dostawę:",
    totalAmount: "Kwota całkowita:",
    
    contactText: "W przypadku pytań skontaktuj się z nami pod adresem",
    invoiceContactText: "W przypadku pytań dotyczących faktury skontaktuj się z nami pod adresem",
    
    vatLabel: "NIP:",
    
    liters: "Litrów",
    
    invoiceFilename: "Faktura",
    
    products: {
      'heating_oil': 'Olej opałowy',
      'diesel': 'Diesel',
      'premium_heating_oil': 'Olej opałowy premium',
      'bio_heating_oil': 'Bio olej opałowy',
      'heating_oil_standard': 'Olej opałowy standardowy',
      'heating_oil_premium': 'Olej opałowy premium',
      'heating_oil_bio': 'Bio olej opałowy',
      'standard_heizoel': 'Olej opałowy standardowy'
    },
    
    managerThanks: 'Chciałbym osobiście podziękować za zaufanie!',
    managerSignature: 'Z poważaniem',
    managerTitle: 'Dyrektor Generalny'
  },
  
  nl: {
    confirmationSubject: "Bestelbevestiging {orderNumber} - Uw {product} bestelling bij {shopName}",
    invoiceSubject: "Uw factuur - Stookolie bestelling bij {shopName}",
    
    greeting: (firstName: string, lastName: string) => `Beste ${firstName} ${lastName},`,
    thanks: "bedankt voor uw bestelling! Uw {product} bestelling is succesvol geplaatst en wordt automatisch verwerkt.",
    regards: "Met vriendelijke groet",
    
    orderConfirmed: "✓ Bestelling bevestigd!",
    orderProcessedAutomatically: "🎉 Status: Uw bestelling wordt automatisch verwerkt. De factuur wordt apart per e-mail verzonden.",
    orderDetails: "📋 Uw bestelgegevens",
    deliveryAddress: "🚚 Bezorgadres",
    statusLabel: "Status:",
    invoiceSeparately: "De factuur wordt apart per e-mail verzonden.",
    
    invoiceAttached: "📄 Uw factuur",
    invoiceInPdf: "bijgaand vindt u de factuur voor uw {product} bestelling. U vindt de factuur als PDF-bijlage in deze e-mail.",
    paymentInfo: "💳 Betalingsinformatie",
    invoiceAmount: "Factuurbedrag:",
    recipient: "Ontvanger:",
    bank: "Bank:",
    paymentReference: "Betalingskenmerk:",
    paymentNote: (invoiceNumber: string, recipientName: string) => 
      `💡 Gebruik beslist het factuurnummer "${invoiceNumber}" als betalingskenmerk en de ontvangernaam "${recipientName}" bij de overschrijving.`,
    invoiceDetails: "📋 Factuurgegevens",
    invoiceDate: "Factuurdatum:",
    pdfAttachmentNotice: "📎 U vindt de volledige factuur als PDF-bestand in de bijlage van deze e-mail.",
    thankYouTrust: "Bedankt voor uw vertrouwen!",
    
    orderNumber: "Bestelnummer:",
    product: "Product:",
    quantity: "Hoeveelheid:",
    pricePerLiter: "Prijs per liter:",
    deliveryFee: "Bezorgkosten:",
    totalAmount: "Totaalbedrag:",
    
    contactText: "Voor vragen kunt u contact met ons opnemen via",
    invoiceContactText: "Voor vragen over uw factuur kunt u contact met ons opnemen via",
    
    vatLabel: "BTW-nr:",
    
    liters: "Liter",
    
    invoiceFilename: "Factuur",
    
    products: {
      'heating_oil': 'Stookolie',
      'diesel': 'Diesel',
      'premium_heating_oil': 'Premium stookolie',
      'bio_heating_oil': 'Bio stookolie',
      'heating_oil_standard': 'Standaard stookolie',
      'heating_oil_premium': 'Premium stookolie',
      'heating_oil_bio': 'Bio stookolie',
      'standard_heizoel': 'Standaard stookolie'
    },
    
    managerThanks: 'Ik wil u persoonlijk bedanken voor uw vertrouwen!',
    managerSignature: 'Met vriendelijke groet',
    managerTitle: 'Directeur'
  }
};

export function getTranslations(language: string): EmailTranslations {
  return translations[language] || translations['de']; // Default to German
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
