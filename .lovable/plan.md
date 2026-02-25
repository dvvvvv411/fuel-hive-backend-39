

## Plan: seven.io SMS-Integration

### Uebersicht

SMS-Versand ueber seven.io (sms77) parallel zu jedem E-Mail-Versand. SMS Templates werden in der Datenbank gespeichert und sind im Preview-Bereich bearbeitbar.

### 1. API-Key als Supabase Secret speichern

- Der seven.io API-Key wird als `SEVEN_API_KEY` Secret gespeichert
- Alle Edge Functions greifen ueber `Deno.env.get('SEVEN_API_KEY')` darauf zu
- Der API-Key ist global fuer alle Shops (sieben.io hat nur einen Account)

### 2. Datenbank-Aenderungen

#### 2.1 Neue Spalte `sms_sender_name` in `shops`

```sql
ALTER TABLE shops ADD COLUMN sms_sender_name text;
```

Max 11 Zeichen, wird als Absendername bei seven.io verwendet.

#### 2.2 Bestehende Shops mit SMS-Absendernamen befuellen

| Shop | sms_sender_name |
|------|----------------|
| SmartHeizoel | SmartHeizol |
| Hill Heizoel | HillHeizoel |
| Heizoel Austria | HeizolAT |
| Total Energies | TotalEnerg |
| Fioul24 | Fioul24 |
| ELREY Heizoel | ELREYHeizol |
| CDR Heizoel | CDRHeizoel |
| Blueline | Blueline |
| Marsell | Marsell |
| Knobloch | Knobloch |

#### 2.3 Neue Tabelle `sms_templates`

```sql
CREATE TABLE sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shops(id),
  template_type text NOT NULL, -- 'order_confirmation', 'invoice', 'contact_attempt'
  template_text text NOT NULL,
  language text NOT NULL DEFAULT 'de',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(shop_id, template_type, language)
);
```

**Wenn kein shop-spezifisches Template existiert, wird ein shop_id=NULL Default-Template verwendet.**

#### 2.4 Default-Templates einfuegen (shop_id = NULL)

**Bestellbestaetigung (max 160 Zeichen):**
```
Hallo {firstName} {lastName}, Ihre Bestellung #{orderNumber} ueber {liters}L wurde bestaetigt. Vielen Dank! Ihr {shopName}-Team
```

**Rechnung (max 160 Zeichen):**
```
Hallo {firstName} {lastName}, Ihre Rechnung zu Bestellung #{orderNumber} wurde per E-Mail versendet. Bitte pruefen Sie Ihr Postfach. {shopName}
```

**Kontaktversuch (max 160 Zeichen):**
```
Hallo {firstName} {lastName}, wir konnten Sie zu Bestellung #{orderNumber} nicht erreichen. Bitte rufen Sie uns an: {shopPhone}. {shopName}
```

### 3. Shop-Dialog anpassen (`src/components/ShopDialog.tsx`)

- Neues Eingabefeld "SMS Absendername" unter der Resend-Konfiguration
- Max 11 Zeichen, mit `maxLength={11}` und Zeichenzaehler
- In formData: `sms_sender_name: ''`

### 4. Neue Edge Function: `send-sms`

Zentrale SMS-Funktion die von allen anderen Edge Functions aufgerufen wird:

```text
POST /send-sms
Body: { to: "+49...", text: "...", from: "ShopName" }
```

- Nutzt seven.io REST API: `https://gateway.seven.io/api/sms`
- Header: `X-Api-Key: {SEVEN_API_KEY}`
- Wird von send-order-confirmation, send-contact-attempt-email, process-manual-order, process-instant-order aufgerufen

### 5. Edge Functions aktualisieren

#### 5.1 `send-order-confirmation/index.ts`

Nach erfolgreichem E-Mail-Versand:
1. SMS-Template aus DB laden (shop-spezifisch oder Default)
2. Platzhalter ersetzen ({firstName}, {lastName}, {orderNumber}, {liters}, {shopName})
3. `send-sms` Edge Function aufrufen mit Kundennummer als Empfaenger
4. Fehler werden geloggt aber blockieren den Prozess nicht

#### 5.2 `send-contact-attempt-email/index.ts`

Nach erfolgreichem E-Mail-Versand:
1. SMS-Template "contact_attempt" laden
2. Platzhalter ersetzen (inkl. {shopPhone})
3. SMS versenden

#### 5.3 `process-manual-order/index.ts` und `process-instant-order/index.ts`

Diese rufen bereits `send-order-confirmation` auf - die SMS wird dort mitversendet. Keine Aenderung noetig.

### 6. Preview-Sektion erweitern (`src/components/InvoicePreview.tsx`)

Neue dritte Sektion "SMS Templates" im Preview-Bereich:

- Shop-Auswahl (geteilt mit anderen Sektionen)
- Sprach-Auswahl
- Template-Typ Dropdown: Bestellbestaetigung / Rechnung / Kontaktversuch
- **Bearbeitbares Textarea** mit dem Template-Text
- Zeichenzaehler (max 160)
- Vorschau mit eingesetzten Beispieldaten
- "Speichern" Button zum Speichern des angepassten Templates in `sms_templates`
- Wenn kein shop-spezifisches Template vorhanden, wird das Default-Template angezeigt
- Beim Speichern wird ein neuer Eintrag fuer den spezifischen Shop erstellt (oder aktualisiert)

### 7. QuickaddShopDialog

- Neues Feld `sms_sender_name` hinzufuegen

### Zusammenfassung der Datei-Aenderungen

| Datei | Aenderung |
|-------|----------|
| DB Migration | `sms_sender_name` Spalte + `sms_templates` Tabelle + Default-Templates + Shop-Updates |
| Supabase Secret | `SEVEN_API_KEY` hinzufuegen |
| `supabase/functions/send-sms/index.ts` | Neue zentrale SMS-Edge-Function |
| `supabase/functions/send-order-confirmation/index.ts` | SMS nach Email-Versand aufrufen |
| `supabase/functions/send-contact-attempt-email/index.ts` | SMS nach Email-Versand aufrufen |
| `src/components/ShopDialog.tsx` | SMS Absendername Feld (max 11 Zeichen) |
| `src/components/QuickaddShopDialog.tsx` | SMS Absendername Feld |
| `src/components/InvoicePreview.tsx` | Neue SMS-Template Sektion mit Bearbeitung |
| `src/integrations/supabase/types.ts` | Wird automatisch aktualisiert |

### Ablauf bei SMS-Versand

```text
Email-Versand erfolgreich
    |
    v
SMS-Template aus DB laden (shop-spezifisch oder Default)
    |
    v
Platzhalter ersetzen
    |
    v
seven.io API aufrufen (POST /api/sms)
    |
    v
Erfolg/Fehler loggen (blockiert nicht den Hauptprozess)
```

