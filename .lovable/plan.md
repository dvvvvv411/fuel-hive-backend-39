

## Plan: Telegram Bot Notifications

### Uebersicht
Telegram-Benachrichtigungen bei neuen Bestellungen. Chat-IDs werden im Dashboard verwaltet und koennen optional einzelnen Shops zugewiesen werden. Ohne Shop-Zuweisung erhaelt die Chat-ID Notifications von **allen** Shops.

### Schritt 1: Telegram Connector verbinden
Telegram Connector ueber `standard_connectors--connect` verknuepfen.

### Schritt 2: Datenbank

Neue Migration mit zwei Tabellen:

- `telegram_chat_ids`: `id`, `chat_id` (text), `label` (text, optional), `active` (bool, default true), `created_at`
- `telegram_chat_id_shops`: `id`, `telegram_chat_id_id` (FK), `shop_id` (FK), unique constraint auf (telegram_chat_id_id, shop_id)

RLS auf beiden Tabellen: nur Admins via `has_role(auth.uid(), 'admin')`.

### Schritt 3: Dashboard-Reiter "Telegram"

| Datei | Aenderung |
|-------|-----------|
| `src/components/TelegramSettings.tsx` | Neues Component: Chat-IDs verwalten, Shops zuweisen (Multi-Select), aktiv/inaktiv Toggle, loeschen |
| `src/components/AppSidebar.tsx` | Nav-Eintrag "Telegram" mit Send-Icon |
| `src/pages/Dashboard.tsx` | `case 'telegram'` in `renderContent` |

### Schritt 4: Edge Function `send-telegram-notification`

| Datei | Aenderung |
|-------|-----------|
| `supabase/functions/send-telegram-notification/index.ts` | Neue Edge Function |
| `supabase/config.toml` | Config fuer neue Function |

**Logik:**
1. Empfaengt `order_id` per POST
2. Laedt Bestelldaten inkl. Shop-Name aus `orders` + `shops`
3. Laedt alle aktiven Chat-IDs; filtert nach Shop-Zuweisung (keine Zuweisung = alle Shops)
4. Telefonnummer formatieren: `phone.replace(/\D/g, '').replace(/^0/, '49')` → `+49...`
5. Produkt-Anzeige: Prueft ob `product`-Feld "premium" enthaelt (case-insensitive) → zeigt "Premium Heizoel" oder "Standard Heizoel"
6. Sendet Nachricht via Telegram Gateway

**Nachrichtenformat:**
```
🛢 Neue Bestellung #1234567

👤 Name: Max Mustermann
📞 Tel: +491722986328
📍 PLZ/Ort: 12345 Berlin
🛢 Produkt: Standard Heizöl
📦 Menge: 3000 Liter
💰 Preis: 2.999,00 €
💳 Zahlung: Überweisung
🏪 Shop: ShopName
```

Mit Inline-Keyboard-Button zum Kopieren der formatierten Telefonnummer.

**Produkt-Logik:**
```ts
const productLabel = product.toLowerCase().includes('premium') 
  ? 'Premium Heizöl' 
  : 'Standard Heizöl';
```

### Schritt 5: create-order erweitern

| Datei | Aenderung |
|-------|-----------|
| `supabase/functions/create-order/index.ts` | Nach Bestellerstellung `send-telegram-notification` aufrufen (fire-and-forget, Fehler blockieren Bestellung nicht) |

