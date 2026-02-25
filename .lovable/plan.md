

## Plan: Manager-Sektion in Rechnungs-Email professioneller gestalten

### Was wird geaendert

Der Text wird professioneller und geschlechtsneutral formuliert:

| Feld | Alt (DE) | Neu (DE) |
|------|----------|----------|
| managerThanks | "Ich moechte mich persoenlich fuer Ihr Vertrauen bedanken!" | "Wir bedanken uns fuer Ihre Bestellung und Ihr Vertrauen in unser Unternehmen." |
| managerTitle | "Geschaeftsfuehrer" | "Geschaeftsleitung" |

"Geschaeftsleitung" ist geschlechtsneutral und vermittelt trotzdem die gleiche Autoritaet. Der Dankestext ist sachlicher und professioneller formuliert.

### Alle Sprachen

| Sprache | managerThanks (neu) | managerTitle (neu) |
|---------|--------------------|--------------------|
| DE | Wir bedanken uns fuer Ihre Bestellung und Ihr Vertrauen in unser Unternehmen. | Geschaeftsleitung |
| EN | We appreciate your order and your trust in our company. | Management |
| FR | Nous vous remercions pour votre commande et votre confiance. | La Direction |
| IT | Vi ringraziamo per il vostro ordine e la vostra fiducia. | La Direzione |
| ES | Le agradecemos su pedido y su confianza en nuestra empresa. | La Direccion |
| PL | Dziekujemy za zamowienie i zaufanie do naszej firmy. | Zarzad |
| NL | Wij danken u voor uw bestelling en uw vertrouwen. | De Directie |

### Betroffene Dateien

| Datei | Aenderung |
|-------|----------|
| `supabase/functions/send-order-confirmation/translations.ts` | managerThanks + managerTitle in allen 7 Sprachen |
| `src/components/EmailPreview.tsx` | managerThanks + managerTitle in DE, EN, FR Preview-Translations |

Keine strukturellen Aenderungen, nur Textanpassungen.

