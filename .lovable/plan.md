

## Plan: Edge Function `get-invoice-by-order`

### Zweck
Oeffentliche Edge Function, die anhand von **Bestellnummer + PLZ + Shop-ID (BrandingID)** die Rechnung und Bankdaten zurueckgibt.

### Eingabe (POST JSON)
```json
{
  "order_number": "1234567",
  "zip_code": "12345",
  "branding_id": "uuid-des-shops"
}
```

### Validierung
- Alle drei Felder muessen vorhanden sein
- Query: `orders` WHERE `order_number` = ? AND (`delivery_postcode` = ? OR `billing_postcode` = ?) AND `shop_id` = ?
- Falls kein Match oder keine Rechnung generiert → generische 404 Fehlermeldung
- Dreifache Validierung verhindert unbefugten Zugriff

### Rueckgabe bei Erfolg
```json
{
  "order_number": "1234567",
  "invoice_url": "https://...",
  "total_amount": 299.99,
  "currency": "EUR",
  "bank_data": {
    "account_holder": "Firma GmbH",
    "iban": "DE89...",
    "bic": "COBADEFFXXX",
    "bank_name": "Commerzbank"
  }
}
```

### Logik
1. Input validieren (order_number, zip_code, branding_id vorhanden)
2. SELECT aus `orders` mit allen drei Kriterien + `invoice_pdf_generated = true`
3. Falls gefunden: Bankdaten aus `bank_accounts` via `selected_bank_account_id` laden
4. Response mit invoice_url, total_amount, currency, bank_data

### Dateien

| Datei | Aenderung |
|-------|-----------|
| `supabase/functions/get-invoice-by-order/index.ts` | Neue Edge Function |
| `supabase/config.toml` | `verify_jwt = false` hinzufuegen |

### RLS
Die Edge Function nutzt `SUPABASE_SERVICE_ROLE_KEY` → RLS wird umgangen. Kein oeffentlicher SELECT auf `orders` noetig. Keine DB-Aenderungen erforderlich.

