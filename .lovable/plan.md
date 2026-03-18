

## Plan: Orders als Cards statt Tabelle

### Uebersicht
Die bestehende Tabelle in `OrdersTable.tsx` (Zeilen 1010-1411) wird durch eine Card-basierte Darstellung ersetzt. Alle Funktionalitaet bleibt identisch — Filter, Pagination, Inline-Editing, Status-Aenderung, Aktions-Buttons, Dialoge. Nur die Darstellung aendert sich von `<Table>` zu gestapelten Cards.

### Card-Layout pro Bestellung

Jede Bestellung wird als eine kompakte Card dargestellt (`bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100`):

```text
┌─────────────────────────────────────────────────────┐
│ #1234567  ·  Standard Heizöl  ·  3000L    [Status▼] │
│                                                     │
│ 👤 Max Mustermann (firma@email.de)    📞 0172...  📋│
│ 📍 Musterstr. 1, 12345 Berlin         ⚠ Abw.      │
│                                                     │
│ 💰 2.999,00 €  ·  Überweisung  ·  Bankkonto XY     │
│ 🏪 ShopName  ·  18.03.2026 14:30                   │
│                                                     │
│ [Details] [Rechnung] [Mail] [Ausblenden]            │
└─────────────────────────────────────────────────────┘
```

### Aenderungen

**Datei: `src/components/OrdersTable.tsx`**

Nur der Render-Teil aendert sich (Zeilen ~1009-1412). Ersetze `<Table>...</Table>` durch:

- `div` mit `space-y-4` Container
- Pro Order eine `Card` mit kompaktem Layout:
  - **Zeile 1 (Header):** Bestellnummer (editierbar), Produkt (editierbar via Select), Menge (editierbar), Status-Dropdown — alles in einer flex-row
  - **Zeile 2:** Kundenname, Firma, E-Mail (editierbar), Telefon mit Copy-Button, Adress-Abweichungs-Indikator
  - **Zeile 3:** Adresse (klickbar zum Bearbeiten), PLZ+Stadt
  - **Zeile 4:** Gesamtpreis (CurrencyDisplay), Zahlungsart/RG-Datum, Bankkonto, Shop, Datum+Uhrzeit
  - **Zeile 5 (Footer):** Aktions-Buttons (Details, Rechnung, Mail, Ready, Bezahlt, Ausblenden) — gleiche Logik wie bisher

Alle bestehenden Inline-Editing States (`editingLitersOrderId`, `editingProductOrderId`, `editingEmailOrderId`) und deren Handler bleiben komplett unveraendert. Nur die JSX-Struktur wird von TableRow/TableCell auf Card-Elemente umgestellt.

- Loading/Empty States werden als zentrierte Texte im Card-Container dargestellt
- Filter-Bereich (Zeilen 906-1007) und Pagination (Zeilen 1414-1465) bleiben komplett unveraendert
- Alle Dialoge am Ende bleiben unveraendert

### Keine weiteren Dateien betroffen
Alles aendert sich nur innerhalb von `OrdersTable.tsx`. Die `Order` Interface, alle Handler-Funktionen, Filter-Logik und Dialoge bleiben identisch.

