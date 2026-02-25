

## Plan: Resend-Konfiguration direkt in Shops & Preview-Tab erweitern

### Teil 1: Resend-Felder direkt in die Shops-Tabelle

#### 1.1 Datenbank-Migration

Neue Spalten zur `shops`-Tabelle hinzufuegen:

```sql
ALTER TABLE shops ADD COLUMN resend_api_key text;
ALTER TABLE shops ADD COLUMN resend_from_email text;
ALTER TABLE shops ADD COLUMN resend_from_name text;
```

Bestehende Daten migrieren (von resend_configs zu shops):

```sql
UPDATE shops s
SET resend_api_key = rc.resend_api_key,
    resend_from_email = rc.from_email,
    resend_from_name = rc.from_name
FROM resend_configs rc
WHERE s.resend_config_id = rc.id;
```

#### 1.2 ShopDialog anpassen (`src/components/ShopDialog.tsx`)

- **Entfernen:** Resend-Dropdown, fetchResendConfigs, ResendConfigDialog-Import, resend_config_id aus formData
- **Hinzufuegen:** Drei neue Felder im "E-Mail-Konfiguration" Abschnitt:
  - Resend API-Key (type="password", placeholder="re_xxxxxxxxxx")
  - Absender-Email (type="email", placeholder="noreply@example.com")
  - Absender-Name (placeholder="Ihr Unternehmen")
- formData erhaelt: `resend_api_key`, `resend_from_email`, `resend_from_name`
- Beim Bearbeiten werden die bestehenden Werte aus dem Shop geladen

#### 1.3 Edge Functions aktualisieren

Vier Edge Functions muessen angepasst werden, damit sie die Resend-Daten direkt aus der `shops`-Tabelle lesen statt ueber die `resend_configs`-Relation:

**`supabase/functions/send-order-confirmation/index.ts`:**
- Query aendern: statt `resend_configs(resend_api_key, from_email, from_name)` direkt `resend_api_key, resend_from_email, resend_from_name` aus shops lesen
- Zugriff aendern: `order.shops?.resend_api_key` statt `order.shops?.resend_configs?.resend_api_key`
- From-Header: `order.shops?.resend_from_name <order.shops?.resend_from_email>`

**`supabase/functions/process-manual-order/index.ts`:**
- Gleiche Anpassung der Query und Zugriffspfade

**`supabase/functions/process-instant-order/index.ts`:**
- Gleiche Anpassung der Query und Zugriffspfade

**`supabase/functions/send-contact-attempt-email/index.ts`:**
- Gleiche Anpassung der Query und Zugriffspfade

#### 1.4 Sidebar: Resend Config Reiter entfernen

**`src/components/AppSidebar.tsx`:**
- Den "Resend Config" Eintrag aus `navigationItems` entfernen

**`src/pages/Dashboard.tsx`:**
- `ResendConfigsList` Import und case entfernen

#### 1.5 QuickaddShopDialog erweitern (`src/components/QuickaddShopDialog.tsx`)

- Drei neue Zeilen fuer Resend-Daten (Zeile 14-16): resend_api_key, resend_from_email, resend_from_name
- Erwartete Zeilen von 13 auf 16 erhoehen

---

### Teil 2: "Invoice Preview" zu "Preview" umbenennen & Email-Templates-Sektion

#### 2.1 Sidebar umbenennen (`src/components/AppSidebar.tsx`)

- "Invoice Preview" zu "Preview" aendern

#### 2.2 InvoicePreview erweitern (`src/components/InvoicePreview.tsx`)

Die Seite bekommt eine klarere Struktur mit zwei Sektionen:

**Sektion 1: Invoice Preview** (bereits vorhanden, bleibt wie es ist)

**Sektion 2: Email Template Preview** (erweitert)
- Eigener Controls-Bereich mit:
  - Shop-Auswahl (teilt sich den State mit der Invoice-Sektion)
  - Sprach-Auswahl
  - Bankkonto-Auswahl
  - **Template-Auswahl Dropdown:** "Bestellbestaetigung", "Rechnung/Invoice", "Kontaktversuch"
- Darunter wird das ausgewaehlte Email-Template gerendert
- Die bestehende `EmailPreview`-Komponente wird wiederverwendet fuer Bestellbestaetigung und Rechnung
- Fuer "Kontaktversuch" wird das Template aus `ContactAttemptEmailPreview` inline gerendert (ohne Dialog)

---

### Zusammenfassung der Datei-Aenderungen

| Datei | Aenderung |
|-------|----------|
| DB Migration | 3 neue Spalten + Datenmigration |
| `src/components/ShopDialog.tsx` | Resend-Dropdown durch direkte Felder ersetzen |
| `src/components/AppSidebar.tsx` | "Resend Config" entfernen, "Invoice Preview" zu "Preview" |
| `src/pages/Dashboard.tsx` | ResendConfigsList entfernen |
| `src/components/InvoicePreview.tsx` | Email-Template-Sektion mit Template-Auswahl |
| `src/components/QuickaddShopDialog.tsx` | 3 neue Resend-Felder (16 Zeilen) |
| `supabase/functions/send-order-confirmation/index.ts` | Resend-Daten aus shops lesen |
| `supabase/functions/process-manual-order/index.ts` | Resend-Daten aus shops lesen |
| `supabase/functions/process-instant-order/index.ts` | Resend-Daten aus shops lesen |
| `supabase/functions/send-contact-attempt-email/index.ts` | Resend-Daten aus shops lesen |

