import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EmailPreviewProps {
  selectedShop: {
    id: string;
    name: string;
    company_name: string;
    company_address: string;
    company_postcode: string;
    company_city: string;
    company_phone?: string;
    company_email: string;
    company_website?: string;
    vat_number?: string;
    language: string;
    currency: string;
    vat_rate: number;
    accent_color?: string;
    bank_accounts?: {
      account_holder: string;
      iban: string;
      bic?: string;
      bank_name?: string;
      use_anyname?: boolean;
    };
  };
  language: string;
  sampleData: {
    invoiceNumber: string;
    orderNumber: string;
    liters: number;
    pricePerLiter: number;
    basePrice: number;
    deliveryFee: number;
    customerName: string;
    deliveryStreet: string;
    deliveryPostcode: string;
    deliveryCity: string;
  };
  totalAmount: number;
  selectedBankAccount?: {
    account_holder: string;
    iban: string;
    bic?: string;
    bank_name?: string;
    use_anyname?: boolean;
  } | null;
}

// Translation helper (simplified version from edge function)
const getEmailTranslations = (lang: string) => {
  const translations: Record<string, any> = {
    de: {
      confirmationSubject: 'Bestellbestätigung - Bestellung {orderNumber}',
      invoiceSubject: 'Ihre Rechnung von {shopName}',
      orderConfirmed: '✓ Bestellung bestätigt',
      invoiceAttached: '📄 Rechnung im Anhang',
      greeting: (firstName: string, lastName: string) => `Hallo ${firstName} ${lastName},`,
      thanks: 'vielen Dank für Ihre Bestellung von {product}.',
      invoiceInPdf: 'anbei finden Sie Ihre Rechnung für {product} als PDF-Datei.',
      orderDetails: 'Bestelldetails',
      orderNumber: 'Bestellnummer',
      product: 'Produkt',
      quantity: 'Menge',
      liters: 'Liter',
      pricePerLiter: 'Preis pro Liter',
      deliveryFee: 'Liefergebühr',
      totalAmount: 'Gesamtbetrag',
      deliveryAddress: 'Lieferadresse',
      orderProcessedAutomatically: 'Ihre Bestellung wurde automatisch bearbeitet und bestätigt.',
      contactText: 'Bei Fragen kontaktieren Sie uns unter',
      regards: 'Mit freundlichen Grüßen',
      vatLabel: 'USt-IdNr:',
      paymentInfo: 'Zahlungsinformationen',
      invoiceAmount: 'Rechnungsbetrag',
      recipient: 'Empfänger',
      bank: 'Bank',
      paymentReference: 'Verwendungszweck',
      paymentNote: (invoiceNum: string, recipient: string) => 
        `Bitte überweisen Sie den Betrag unter Angabe der Rechnungsnummer "${invoiceNum}" an ${recipient}.`,
      products: {
        heating_oil: 'Heizöl',
        diesel: 'Diesel',
        pellets: 'Pellets'
      }
    },
    en: {
      confirmationSubject: 'Order Confirmation - Order {orderNumber}',
      invoiceSubject: 'Your Invoice from {shopName}',
      orderConfirmed: '✓ Order Confirmed',
      invoiceAttached: '📄 Invoice Attached',
      greeting: (firstName: string, lastName: string) => `Hello ${firstName} ${lastName},`,
      thanks: 'thank you for your order of {product}.',
      invoiceInPdf: 'please find attached your invoice for {product} as a PDF file.',
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
      vatLabel: 'VAT ID:',
      paymentInfo: 'Payment Information',
      invoiceAmount: 'Invoice Amount',
      recipient: 'Recipient',
      bank: 'Bank',
      paymentReference: 'Payment Reference',
      paymentNote: (invoiceNum: string, recipient: string) => 
        `Please transfer the amount using the invoice number "${invoiceNum}" to ${recipient}.`,
      products: {
        heating_oil: 'Heating Oil',
        diesel: 'Diesel',
        pellets: 'Pellets'
      }
    },
    fr: {
      confirmationSubject: 'Confirmation de commande - Commande {orderNumber}',
      invoiceSubject: 'Votre facture de {shopName}',
      orderConfirmed: '✓ Commande confirmée',
      invoiceAttached: '📄 Facture jointe',
      greeting: (firstName: string, lastName: string) => `Bonjour ${firstName} ${lastName},`,
      thanks: 'merci pour votre commande de {product}.',
      invoiceInPdf: 'veuillez trouver ci-joint votre facture pour {product} au format PDF.',
      orderDetails: 'Détails de la commande',
      orderNumber: 'Numéro de commande',
      product: 'Produit',
      quantity: 'Quantité',
      liters: 'Litres',
      pricePerLiter: 'Prix par litre',
      deliveryFee: 'Frais de livraison',
      totalAmount: 'Montant total',
      deliveryAddress: 'Adresse de livraison',
      orderProcessedAutomatically: 'Votre commande a été traitée et confirmée automatiquement.',
      contactText: 'Pour toute question, contactez-nous à',
      regards: 'Cordialement',
      vatLabel: 'N° TVA:',
      paymentInfo: 'Informations de paiement',
      invoiceAmount: 'Montant de la facture',
      recipient: 'Destinataire',
      bank: 'Banque',
      paymentReference: 'Référence de paiement',
      paymentNote: (invoiceNum: string, recipient: string) => 
        `Veuillez virer le montant en indiquant le numéro de facture "${invoiceNum}" à ${recipient}.`,
      products: {
        heating_oil: 'Fioul',
        diesel: 'Diesel',
        pellets: 'Granulés'
      }
    }
  };

  return translations[lang] || translations.de;
};

const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
  const symbols: Record<string, string> = {
    EUR: '€',
    PLN: 'zł',
    USD: '$',
    GBP: '£'
  };
  const symbol = symbols[currency?.toUpperCase()] || '€';
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ' + symbol;
};

const formatIBAN = (iban: string): string => {
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  return cleanIban.replace(/(.{4})/g, '$1 ').trim();
};

const interpolateString = (template: string, variables: Record<string, string>): string => {
  return template.replace(/\{(\w+)\}/g, (_, key) => variables[key] || '');
};

export function EmailPreview({ selectedShop, language, sampleData, totalAmount, selectedBankAccount }: EmailPreviewProps) {
  const t = getEmailTranslations(language);
  const shopName = selectedShop.company_name;
  const accentColor = selectedShop.accent_color || '#2563eb';
  const translatedProduct = t.products.heating_oil;

  const generateConfirmationEmail = useMemo(() => {
    const subject = interpolateString(t.confirmationSubject, {
      orderNumber: sampleData.orderNumber,
      product: translatedProduct,
      shopName: shopName
    });

    const html = `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
                
                <tr>
                  <td style="padding: 50px 40px 30px 40px; text-align: center; background: ${accentColor}; border-radius: 12px 12px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; line-height: 1.2; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      ${shopName}
                    </h1>
                    <div style="margin: 20px 0 0 0; padding: 12px 24px; background-color: rgba(255,255,255,0.2); border-radius: 50px; display: inline-block;">
                      <span style="color: #ffffff; font-size: 18px; font-weight: 600;">
                        ${t.orderConfirmed}
                      </span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 24px 0; color: #374151; font-size: 18px; line-height: 1.6;">
                      ${t.greeting('Max', 'Mustermann')}
                    </p>
                    
                    <p style="margin: 0 0 32px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      ${interpolateString(t.thanks, { product: translatedProduct })}
                    </p>

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 12px; border: 2px solid ${accentColor}; margin-bottom: 32px;">
                      <tr>
                        <td style="padding: 30px;">
                          <h2 style="margin: 0 0 24px 0; color: ${accentColor}; font-size: 22px; font-weight: 700; text-align: center;">
                            ${t.orderDetails}
                          </h2>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 15px; font-weight: 600; width: 40%;">${t.orderNumber}</td>
                              <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700;">${sampleData.orderNumber}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 15px; font-weight: 600;">${t.product}</td>
                              <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700;">${translatedProduct}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 15px; font-weight: 600;">${t.quantity}</td>
                              <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700;">${sampleData.liters} ${t.liters}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 15px; font-weight: 600;">${t.pricePerLiter}</td>
                              <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700;">${formatCurrency(sampleData.pricePerLiter, selectedShop.currency)}</td>
                            </tr>
                            ${sampleData.deliveryFee > 0 ? `
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 15px; font-weight: 600;">${t.deliveryFee}</td>
                              <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700;">${formatCurrency(sampleData.deliveryFee, selectedShop.currency)}</td>
                            </tr>
                            ` : ''}
                            <tr style="border-top: 2px solid ${accentColor};">
                              <td style="padding: 16px 0 8px 0; color: ${accentColor}; font-size: 18px; font-weight: 700;">${t.totalAmount}</td>
                              <td style="padding: 16px 0 8px 0; color: ${accentColor}; font-size: 18px; font-weight: 700;">${formatCurrency(totalAmount, selectedShop.currency)}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 32px;">
                      <tr>
                        <td style="padding: 24px;">
                          <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                            ${t.deliveryAddress}
                          </h3>
                          <div style="color: #374151; font-size: 15px; line-height: 1.6;">
                            <div style="font-weight: 600; margin-bottom: 4px;">${sampleData.customerName}</div>
                            <div>${sampleData.deliveryStreet}</div>
                            <div>${sampleData.deliveryPostcode} ${sampleData.deliveryCity}</div>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; border: 2px solid #10b981; margin-bottom: 32px;">
                      <tr>
                        <td style="padding: 24px; text-align: center;">
                          <div style="color: #047857; font-size: 16px; line-height: 1.6; font-weight: 600;">
                            ${t.orderProcessedAutomatically}
                          </div>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      ${t.contactText} ${selectedShop.company_email}.
                    </p>

                    <p style="margin: 32px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6; text-align: center;">
                      ${t.regards}<br>
                      <strong style="color: ${accentColor};">${shopName}</strong>
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                    <div style="text-align: center; color: #6b7280; font-size: 13px; line-height: 1.5;">
                      <div style="margin-bottom: 8px;">
                        <strong>${shopName}</strong>
                      </div>
                      <div>
                        ${selectedShop.company_address} • ${selectedShop.company_postcode} ${selectedShop.company_city}
                      </div>
                      ${selectedShop.vat_number ? `<div style="margin-top: 8px;">${t.vatLabel} ${selectedShop.vat_number}</div>` : ''}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return { subject, html };
  }, [selectedShop, language, sampleData, totalAmount, t, accentColor, shopName, translatedProduct]);

  const generateInvoiceEmail = useMemo(() => {
    // Use selected bank account if available, otherwise fall back to shop's bank account
    const bankData = selectedBankAccount || selectedShop.bank_accounts;
    const recipientName = bankData?.use_anyname ? shopName : (bankData?.account_holder || shopName);
    
    const subject = interpolateString(t.invoiceSubject, { shopName });

    const html = `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
                
                <tr>
                  <td style="padding: 50px 40px 30px 40px; text-align: center; background: ${accentColor}; border-radius: 12px 12px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; line-height: 1.2; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      ${shopName}
                    </h1>
                    <div style="margin: 20px 0 0 0; padding: 12px 24px; background-color: rgba(255,255,255,0.2); border-radius: 50px; display: inline-block;">
                      <span style="color: #ffffff; font-size: 18px; font-weight: 600;">
                        ${t.invoiceAttached}
                      </span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 24px 0; color: #374151; font-size: 18px; line-height: 1.6;">
                      ${t.greeting('Max', 'Mustermann')}
                    </p>
                    
                    <p style="margin: 0 0 32px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      ${interpolateString(t.invoiceInPdf, { product: translatedProduct })}
                    </p>

                    ${bankData ? `
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; border: 2px solid #3b82f6; margin-bottom: 32px;">
                      <tr>
                        <td style="padding: 30px;">
                          <h3 style="margin: 0 0 20px 0; color: #3b82f6; font-size: 20px; font-weight: 700; text-align: center;">
                            ${t.paymentInfo}
                          </h3>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 8px 0; color: #1e40af; font-size: 15px; font-weight: 600; width: 35%;">${t.invoiceAmount}</td>
                              <td style="padding: 8px 0; color: #1e3a8a; font-size: 18px; font-weight: 700;">${formatCurrency(totalAmount, selectedShop.currency)}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #1e40af; font-size: 15px; font-weight: 600;">${t.recipient}</td>
                              <td style="padding: 8px 0; color: #1e3a8a; font-size: 15px; font-weight: 700;">${recipientName}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #1e40af; font-size: 15px; font-weight: 600;">${t.bank}</td>
                              <td style="padding: 8px 0; color: #1e3a8a; font-size: 15px; font-weight: 700;">${bankData.bank_name}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #1e40af; font-size: 15px; font-weight: 600;">IBAN:</td>
                              <td style="padding: 8px 0; color: #1e3a8a; font-size: 15px; font-weight: 700;"><strong>${formatIBAN(bankData.iban)}</strong></td>
                            </tr>
                            ${bankData.bic ? `
                            <tr>
                              <td style="padding: 8px 0; color: #1e40af; font-size: 15px; font-weight: 600;">BIC:</td>
                              <td style="padding: 8px 0; color: #1e3a8a; font-size: 15px; font-weight: 700;"><strong>${bankData.bic}</strong></td>
                            </tr>
                            ` : ''}
                            <tr>
                              <td style="padding: 8px 0; color: #1e40af; font-size: 15px; font-weight: 600;">${t.paymentReference}</td>
                              <td style="padding: 8px 0; color: #1e3a8a; font-size: 15px; font-weight: 700;">${sampleData.invoiceNumber}</td>
                            </tr>
                          </table>
                          <div style="margin-top: 16px; padding: 16px; background-color: rgba(59, 130, 246, 0.1); border-radius: 8px; border-left: 4px solid #3b82f6;">
                            <p style="margin: 0; color: #1e40af; font-size: 14px; font-weight: 600;">
                              ${t.paymentNote(sampleData.invoiceNumber, recipientName)}
                            </p>
                          </div>
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                    ${bankData ? `
                    <!-- Personal Thanks from Account Holder -->
                    <div style="margin: 40px 0 32px 0; padding: 30px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; border: 2px solid #10b981; border-left: 6px solid #10b981;">
                      <p style="margin: 0 0 20px 0; color: #065f46; font-size: 17px; line-height: 1.6; font-style: italic; text-align: center;">
                        "${t.managerThanks}"
                      </p>
                      <div style="margin-top: 24px; padding-top: 20px; border-top: 2px solid #10b981;">
                        <p style="margin: 0; color: #065f46; font-size: 16px; line-height: 1.8; text-align: left;">
                          ${t.managerSignature}<br>
                          <strong style="color: #047857; font-size: 18px;">${bankData.account_holder}</strong><br>
                          <span style="color: #059669; font-size: 14px; font-style: italic;">${t.managerTitle}</span>
                        </p>
                      </div>
                    </div>
                    ` : ''}

                    <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      ${t.contactText} ${selectedShop.company_email}.
                    </p>

                    <p style="margin: 32px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6; text-align: center;">
                      ${t.regards}<br>
                      <strong style="color: ${accentColor};">${shopName}</strong>
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                    <div style="text-align: center; color: #6b7280; font-size: 13px; line-height: 1.5;">
                      <div style="margin-bottom: 8px;">
                        <strong>${shopName}</strong>
                      </div>
                      <div>
                        ${selectedShop.company_address} • ${selectedShop.company_postcode} ${selectedShop.company_city}
                      </div>
                      ${selectedShop.vat_number ? `<div style="margin-top: 8px;">${t.vatLabel} ${selectedShop.vat_number}</div>` : ''}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return { subject, html };
  }, [selectedShop, language, sampleData, totalAmount, t, accentColor, shopName, translatedProduct, selectedBankAccount]);

  return (
    <Tabs defaultValue="confirmation" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="confirmation">Bestellbestätigung</TabsTrigger>
        <TabsTrigger value="invoice">Rechnungs-E-Mail</TabsTrigger>
      </TabsList>

      <TabsContent value="confirmation" className="mt-4">
        <div className="space-y-3">
          <div className="bg-muted p-3 rounded-md border">
            <p className="text-sm font-medium text-muted-foreground">Betreff:</p>
            <p className="text-sm font-semibold">{generateConfirmationEmail.subject}</p>
          </div>
          <div className="border rounded-lg overflow-hidden bg-white">
            <iframe
              srcDoc={generateConfirmationEmail.html}
              className="w-full h-[600px] border-0"
              title="Order Confirmation Email Preview"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="invoice" className="mt-4">
        <div className="space-y-3">
          <div className="bg-muted p-3 rounded-md border">
            <p className="text-sm font-medium text-muted-foreground">Betreff:</p>
            <p className="text-sm font-semibold">{generateInvoiceEmail.subject}</p>
          </div>
          <div className="border rounded-lg overflow-hidden bg-white">
            <iframe
              srcDoc={generateInvoiceEmail.html}
              className="w-full h-[600px] border-0"
              title="Invoice Email Preview"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
