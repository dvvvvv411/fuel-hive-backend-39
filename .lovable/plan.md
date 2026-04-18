
Replace shop multi-select pills with a searchable dropdown (Combobox pattern) in two places:

### 1. `src/components/TelegramSettings.tsx`
Replace the "Shops zuweisen" `Badge` pill list with a `Popover` + `Command` combobox:
- Trigger button shows count ("X Shops ausgewählt" / "Alle Shops").
- Popover contains `Command` with `CommandInput` (search), `CommandList`, `CommandGroup`, `CommandItem` per shop.
- Each item shows checkmark when selected; clicking toggles `selectedShops`.
- Selected shops shown as small removable badges below the trigger (optional, keeps overview).

### 2. `src/components/EmployeeManagement.tsx`
Locate the existing shop assignment UI for callers (currently pills based on memory). Replace with the same `Popover` + `Command` searchable multi-select pattern.

### Components used (already in project)
- `@/components/ui/popover` (Popover, PopoverTrigger, PopoverContent)
- `@/components/ui/command` (Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList)
- `@/components/ui/button`, `lucide-react` icons (`Check`, `ChevronsUpDown`, `Store`, `X`)

### Behavior
- Search filters shop list by name (cmdk built-in).
- Multi-select: clicking item toggles, popover stays open.
- Empty selection = "Alle Shops" (Telegram) / "Alle Shops sichtbar" (Mitarbeiter), preserving existing semantics.
- No DB schema changes, no API changes — pure UI refactor.

### Files touched
| File | Change |
|------|--------|
| `src/components/TelegramSettings.tsx` | Replace pills with searchable combobox in add-form |
| `src/components/EmployeeManagement.tsx` | Replace pills with searchable combobox in caller shop assignment |
