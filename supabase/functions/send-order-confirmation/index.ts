import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getTranslations, detectLanguage, interpolateString } from './translations.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Currency utility functions
const getCurrencySymbol = (currency: string): string => {
  switch (currency?.toUpperCase()) {
    case 'EUR':
      return '€';
    case 'PLN':
      return 'zł';
    case 'USD':
      return '$';
    case 'GBP':
      return '£';
    default:
      return '€';
  }
};

const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
  const symbol = getCurrencySymbol(currency);
  return new Intl.NumberFormat('de-DE', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ' + symbol;
};

interface EmailRequest {
  order_id: string;
  include_invoice: boolean;
  email_type: 'instant_confirmation' | 'manual_confirmation';
  deposit_percentage?: number;
}

const formatIBAN = (iban: string): string => {
  // Remove any existing spaces and convert to uppercase
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  
  // Add spaces every 4 characters
  return cleanIban.replace(/(.{4})/g, '$1 ').trim();
};

// Optimized base64 conversion to prevent stack overflow
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192; // Process in smaller chunks
  let result = '';
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    result += String.fromCharCode(...chunk);
  }
  
  return btoa(result);
};

const generateConfirmationEmailTemplate = (order: any, language: string = 'de') => {
  const t = getTranslations(language);
  const shopName = (order.shops?.name || order.shops?.company_name || 'Heizöl-Service').trim();
  const accentColor = order.shops?.accent_color || '#2563eb';
  const translatedProduct = t.products[order.product] || order.product;
  
  const subject = interpolateString(t.confirmationSubject, {
    orderNumber: order.order_number,
    product: translatedProduct,
    shopName: shopName
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
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

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 24px 0; color: #374151; font-size: 18px; line-height: 1.6;">
                    ${t.greeting(order.delivery_first_name, order.delivery_last_name)}
                  </p>
                  
                  <p style="margin: 0 0 32px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                    ${interpolateString(t.thanks, { product: translatedProduct })}
                  </p>

                  <!-- Order Details Box -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 12px; border: 2px solid ${accentColor}; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 30px;">
                        <h2 style="margin: 0 0 24px 0; color: ${accentColor}; font-size: 22px; font-weight: 700; text-align: center;">
                          ${t.orderDetails}
                        </h2>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 15px; font-weight: 600; width: 40%;">${t.orderNumber}</td>
                            <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700;">${order.order_number}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 15px; font-weight: 600;">${t.product}</td>
                            <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700;">${translatedProduct}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 15px; font-weight: 600;">${t.quantity}</td>
                            <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700;">${order.liters} ${t.liters}</td>
                          </tr>
                           <tr>
                             <td style="padding: 8px 0; color: #6b7280; font-size: 15px; font-weight: 600;">${t.pricePerLiter}</td>
                             <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700;">${formatCurrency(order.price_per_liter, order.currency || 'EUR')}</td>
                           </tr>
                           ${order.delivery_fee > 0 ? `
                           <tr>
                             <td style="padding: 8px 0; color: #6b7280; font-size: 15px; font-weight: 600;">${t.deliveryFee}</td>
                             <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700;">${formatCurrency(order.delivery_fee, order.currency || 'EUR')}</td>
                           </tr>
                           ` : ''}
                           <tr style="border-top: 2px solid ${accentColor};">
                             <td style="padding: 16px 0 8px 0; color: ${accentColor}; font-size: 18px; font-weight: 700;">${t.totalAmount}</td>
                             <td style="padding: 16px 0 8px 0; color: ${accentColor}; font-size: 18px; font-weight: 700;">${formatCurrency(order.total_amount, order.currency || 'EUR')}</td>
                           </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Delivery Address Box -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 24px;">
                        <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                          ${t.deliveryAddress}
                        </h3>
                        <div style="color: #374151; font-size: 15px; line-height: 1.6;">
                          <div style="font-weight: 600; margin-bottom: 4px;">
                            ${order.delivery_first_name} ${order.delivery_last_name}
                          </div>
                          <div>${order.delivery_street}</div>
                          <div>${order.delivery_postcode} ${order.delivery_city}</div>
                          ${order.delivery_phone ? `<div style="margin-top: 8px;">📞 ${order.delivery_phone}</div>` : ''}
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Status Box -->
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
                    ${t.contactText} ${order.shops?.company_email}.
                  </p>

                  <p style="margin: 32px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6; text-align: center;">
                    ${t.regards}<br>
                    <strong style="color: ${accentColor};">${shopName}</strong>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                  <div style="text-align: center; color: #6b7280; font-size: 13px; line-height: 1.5;">
                    <div style="margin-bottom: 8px;">
                      <strong>${shopName}</strong>
                    </div>
                    <div>
                      ${order.shops?.company_address || ''} • ${order.shops?.company_postcode || ''} ${order.shops?.company_city || ''}
                    </div>
                    ${order.shops?.vat_number ? `<div style="margin-top: 8px;">${t.vatLabel} ${order.shops.vat_number}</div>` : ''}
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

  return { subject, htmlContent };
};

const generateInvoiceEmailTemplate = (order: any, bankData: any, language: string = 'de', depositPercentage?: number) => {
  const t = getTranslations(language);
  const shopName = (order.shops?.name || 'Heizöl-Service').trim();
  const accentColor = order.shops?.accent_color || '#2563eb';
  const translatedProduct = t.products[order.product] || order.product;
  
  // Use temp_order_number if available, otherwise use original order_number
  const invoiceNumber = order.temp_order_number || order.order_number;
  const recipientName = bankData?.use_anyname ? shopName : (bankData?.account_holder || shopName);
  
  // Debug logging to check values
  console.log('Invoice email variables:');
  console.log('- shopName (trimmed):', shopName);
  console.log('- invoiceNumber:', invoiceNumber);
  console.log('- recipientName:', recipientName);
  console.log('- use_anyname:', bankData?.use_anyname);
  console.log('- account_holder:', bankData?.account_holder);
  console.log('- language:', language);
  console.log('- temp_order_number:', order.temp_order_number);
  console.log('- original order_number:', order.order_number);
  
  const subject = interpolateString(t.invoiceSubject, {
    shopName: shopName
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
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

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 24px 0; color: #374151; font-size: 18px; line-height: 1.6;">
                    ${t.greeting(order.delivery_first_name, order.delivery_last_name)}
                  </p>
                  
                  <p style="margin: 0 0 32px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                    ${interpolateString(t.invoiceInPdf, { product: translatedProduct })}
                  </p>

                  <!-- Payment Information Box -->
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
                              <td style="padding: 8px 0; color: #1e3a8a; font-size: 18px; font-weight: 700;">${formatCurrency(depositPercentage 
                                ? (order.total_amount * (depositPercentage / 100)) 
                                : order.total_amount, order.currency || 'EUR')}${depositPercentage ? ` (${depositPercentage}% Anzahlung)` : ''}</td>
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
                            <td style="padding: 8px 0; color: #1e3a8a; font-size: 15px; font-weight: 700;">${invoiceNumber}</td>
                          </tr>
                        </table>
                        <div style="margin-top: 16px; padding: 16px; background-color: rgba(59, 130, 246, 0.1); border-radius: 8px; border-left: 4px solid #3b82f6;">
                          <p style="margin: 0; color: #1e40af; font-size: 14px; font-weight: 600;">
                            ${t.paymentNote(invoiceNumber, recipientName)}
                          </p>
                        </div>
                      </td>
                    </tr>
                  </table>
                  ` : ''}

                  <!-- Invoice Details Box -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 12px; border: 2px solid ${accentColor}; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 30px;">
                        <h2 style="margin: 0 0 24px 0; color: ${accentColor}; font-size: 22px; font-weight: 700; text-align: center;">
                          ${t.invoiceDetails}
                        </h2>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 15px; font-weight: 600; width: 40%;">${t.orderNumber}</td>
                            <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700;">${invoiceNumber}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 15px; font-weight: 600;">${t.invoiceDate}</td>
                            <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700;">${new Date(order.invoice_date || order.created_at).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'en' ? 'en-US' : language === 'fr' ? 'fr-FR' : language === 'it' ? 'it-IT' : language === 'es' ? 'es-ES' : language === 'pl' ? 'pl-PL' : 'nl-NL')}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 15px; font-weight: 600;">${t.product}</td>
                            <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700;">${translatedProduct}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 15px; font-weight: 600;">${t.quantity}</td>
                            <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700;">${order.liters} ${t.liters}</td>
                          </tr>
                           <tr style="border-top: 2px solid ${accentColor};">
                             <td style="padding: 16px 0 8px 0; color: ${accentColor}; font-size: 18px; font-weight: 700;">${t.invoiceAmount}</td>
                             <td style="padding: 16px 0 8px 0; color: ${accentColor}; font-size: 18px; font-weight: 700;">${formatCurrency(order.total_amount, order.currency || 'EUR')}</td>
                           </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- PDF Attachment Notice -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; border: 2px solid #f59e0b; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 24px; text-align: center;">
                        <div style="color: #92400e; font-size: 16px; line-height: 1.6; font-weight: 600;">
                          ${t.pdfAttachmentNotice}
                        </div>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                    ${t.invoiceContactText} ${order.shops?.company_email}.
                  </p>

                  <p style="margin: 32px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6; text-align: center;">
                    ${t.thankYouTrust}<br>
                    <strong style="color: ${accentColor};">${shopName}</strong>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                  <div style="text-align: center; color: #6b7280; font-size: 13px; line-height: 1.5;">
                    <div style="margin-bottom: 8px;">
                      <strong>${shopName}</strong>
                    </div>
                    <div>
                      ${order.shops?.company_address || ''} • ${order.shops?.company_postcode || ''} ${order.shops?.company_city || ''}
                    </div>
                    ${order.shops?.vat_number ? `<div style="margin-top: 8px;">${t.vatLabel} ${order.shops.vat_number}</div>` : ''}
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

  return { subject, htmlContent };
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
    const { order_id, include_invoice, email_type, deposit_percentage }: EmailRequest = await req.json();
    console.log('Sending confirmation email for order:', order_id, 'Type:', email_type, 'Include invoice:', include_invoice);
    if (deposit_percentage) {
      console.log('Deposit percentage:', deposit_percentage);
    }

    // Get order with shop and resend config
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        shops (
          name,
          company_name,
          company_email,
          company_phone,
          company_address,
          company_city,
          company_postcode,
          vat_number,
          accent_color,
          support_phone,
          bank_account_id,
          country_code,
          language,
          resend_configs (
            resend_api_key,
            from_email,
            from_name
          )
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

    const resendConfig = order.shops?.resend_configs;
    if (!resendConfig?.resend_api_key) {
      console.error('No Resend configuration found for shop');
      return new Response(JSON.stringify({ error: 'No email configuration found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Detect language for the email
    const language = detectLanguage(order);
    console.log('Detected language:', language);

    // PRIORITY ORDER FOR BANK ACCOUNT SELECTION:
    // 1. selected_bank_account_id from the order (highest priority)
    // 2. Temporary bank account associated with this order
    // 3. Shop's default bank account (fallback)
    
    let bankData = null;
    if (include_invoice) {
      console.log('Looking for bank account data for invoice email in priority order...');
      
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
          console.log('Using temporary bank account for email:', tempBankAccount.account_name);
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
        console.log('Using shop default bank account as fallback');
        
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
        console.warn('No bank account found for invoice email');
      } else {
        console.log('Bank account selected for email:', bankData.account_name);
      }
    }

    // Initialize Resend
    const resend = new Resend(resendConfig.resend_api_key);

    // Generate email template based on type
    const { subject, htmlContent } = include_invoice
      ? generateInvoiceEmailTemplate(order, bankData, language, deposit_percentage)
      : generateConfirmationEmailTemplate(order, language);

    // Prepare email payload
    const emailPayload: any = {
      from: `${resendConfig.from_name} <${resendConfig.from_email}>`,
      to: [order.customer_email],
      subject: subject,
      html: htmlContent,
    };

    // Add PDF attachment for invoice emails
    let attachmentAdded = false;
    if (include_invoice && order.invoice_pdf_url) {
      try {
        console.log('Adding PDF attachment for invoice:', order.temp_order_number || order.order_number);
        
        // Download PDF from Supabase Storage
        const fileName = order.invoice_pdf_url.split('/').pop() || '';
        console.log('Downloading PDF file:', fileName);
        
        const { data: pdfData, error: downloadError } = await supabase.storage
          .from('invoices')
          .download(fileName);

        if (downloadError) {
          console.error('Error downloading PDF:', downloadError);
          throw new Error(`Failed to download PDF: ${downloadError.message}`);
        }

        if (!pdfData) {
          console.error('No PDF data received');
          throw new Error('No PDF data received from storage');
        }

        console.log('PDF downloaded successfully, size:', pdfData.size, 'bytes');

        // Convert blob to base64 using optimized method
        const arrayBuffer = await pdfData.arrayBuffer();
        console.log('Converting to base64, buffer size:', arrayBuffer.byteLength, 'bytes');
        
        const base64 = arrayBufferToBase64(arrayBuffer);
        console.log('Base64 conversion completed, length:', base64.length, 'characters');

        const t = getTranslations(language);
        const orderNumberForFilename = order.temp_order_number || order.order_number;
        emailPayload.attachments = [{
          filename: `${t.invoiceFilename}-${orderNumberForFilename}.pdf`,
          content: base64,
          content_type: 'application/pdf',
        }];

        attachmentAdded = true;
        console.log('PDF attachment added successfully to email');
        
      } catch (attachmentError) {
        console.error('Error adding PDF attachment:', attachmentError);
        // Don't throw here - continue sending email without attachment
        console.log('Continuing to send email without PDF attachment');
      }
    }

    // Send email
    console.log('Sending email to:', order.customer_email, 'in language:', language);
    const emailResponse = await resend.emails.send(emailPayload);

    if (emailResponse.error) {
      console.error('Error sending email:', emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    console.log('Email sent successfully:', emailResponse);

    // Update order status if this is an invoice email that was sent successfully
    let statusUpdated = false;
    if (include_invoice && emailResponse.data?.id) {
      try {
        console.log('Updating order status to invoice_sent');
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            status: 'invoice_sent',
            invoice_sent: true
          })
          .eq('id', order_id);

        if (updateError) {
          console.error('Error updating order status:', updateError);
        } else {
          statusUpdated = true;
          console.log('Order status updated successfully to invoice_sent');
        }
      } catch (updateError) {
        console.error('Error updating order status:', updateError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      email_id: emailResponse.data?.id,
      email_type: include_invoice ? 'invoice' : 'confirmation',
      sent_to: order.customer_email,
      language: language,
      attachment_included: attachmentAdded,
      attachment_attempted: include_invoice && !!order.invoice_pdf_url,
      bank_data_included: !!bankData,
      bank_account_used: bankData?.account_name || 'none',
      status_updated: statusUpdated,
      sent_at: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error in send-order-confirmation function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
