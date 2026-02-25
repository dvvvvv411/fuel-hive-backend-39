

## Plan: Telefonnummern-Formatierung fuer seven.io

### Aenderung

Eine `formatPhoneNumber`-Funktion wird in `supabase/functions/send-sms/index.ts` hinzugefuegt, die alle eingehenden Telefonnummern automatisch ins internationale Format konvertiert, bevor sie an seven.io gesendet werden.

### Logik der Formatierung

1. Alle Leerzeichen, Bindestriche und Klammern entfernen
2. Fuehrende `00` durch `+` ersetzen (z.B. `0049` wird `+49`)
3. Fuehrende `0` durch `+49` ersetzen (z.B. `0175...` wird `+49175...`)
4. Wenn keine `+` vorhanden, `+49` voranstellen

Beispiele:
- `0175 8678706` wird `+491758678706`
- `+49 175 867 8706` wird `+491758678706`
- `0049 175 8678706` wird `+491758678706`
- `+33612345678` bleibt `+33612345678` (nicht-deutsche Nummern bleiben erhalten)

### Betroffene Datei

| Datei | Aenderung |
|-------|----------|
| `supabase/functions/send-sms/index.ts` | `formatPhoneNumber()` Funktion hinzufuegen, auf `to` anwenden bevor SMS gesendet wird |

Die Formatierung passiert zentral in der send-sms Funktion, sodass alle aufrufenden Edge Functions automatisch davon profitieren ohne eigene Aenderungen.

