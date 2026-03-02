

## Plan: SMS Template Speichern reparieren

### Problem

Der "Speichern"-Button in der SMS Template Sektion funktioniert nicht. Es gibt zwei Probleme im Code:

### 1. Upsert `onConflict` Problem

Die `upsert`-Operation verwendet `onConflict: 'shop_id,template_type,language'`, was als String uebergeben wird. Bei manchen Supabase-Versionen muss das exakt dem Constraint-Namen oder den Spaltennamen entsprechen. Ausserdem koennte der Upsert fehlschlagen ohne einen sichtbaren Fehler zu werfen, weil der Fehler im catch-Block nur in die Konsole geloggt wird.

### 2. Fehlende Fehlerbehandlung und Debugging

Die `handleSave`-Funktion loggt Fehler nur in die Konsole, aber zeigt dem User keinen hilfreichen Fehler an. Ausserdem fehlt besseres Logging um das Problem zu identifizieren.

### Loesung

In `src/components/SmsTemplatePreview.tsx`:

1. **Upsert durch separates Insert/Select ersetzen**: Statt `upsert` wird zuerst geprueft ob ein shop-spezifisches Template existiert, dann entweder `update` oder `insert` aufgerufen
2. **Bessere Fehlerbehandlung**: Detaillierte Fehlermeldungen im Toast anzeigen
3. **Console-Logging verbessern**: Mehr Debug-Output um Probleme zu identifizieren

### Betroffene Datei

| Datei | Aenderung |
|-------|----------|
| `src/components/SmsTemplatePreview.tsx` | `handleSave` ueberarbeiten: upsert durch explizites insert/update ersetzen, besseres Error-Handling |

### Neue Save-Logik

```text
handleSave:
  1. Pruefe ob shop-spezifisches Template existiert (SELECT mit shop_id + template_type + language)
  2. Falls ja -> UPDATE template_text WHERE id = existing.id
  3. Falls nein -> INSERT neues Template mit shop_id, template_type, language, template_text
  4. Toast mit Erfolg/Fehler anzeigen
  5. loadTemplate() aufrufen um den State zu aktualisieren
```

