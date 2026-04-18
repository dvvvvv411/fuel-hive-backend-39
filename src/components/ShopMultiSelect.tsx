import { Check, ChevronsUpDown, Store, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Shop {
  id: string;
  name: string;
}

interface ShopMultiSelectProps {
  shops: Shop[];
  selectedShopIds: string[];
  onChange: (ids: string[]) => void;
  emptyLabel?: string;
  placeholder?: string;
  className?: string;
}

export function ShopMultiSelect({
  shops,
  selectedShopIds,
  onChange,
  emptyLabel = 'Alle Shops',
  placeholder = 'Shops suchen...',
  className,
}: ShopMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggle = (id: string) => {
    onChange(
      selectedShopIds.includes(id)
        ? selectedShopIds.filter(s => s !== id)
        : [...selectedShopIds, id]
    );
  };

  const remove = (id: string) => {
    onChange(selectedShopIds.filter(s => s !== id));
  };

  const getName = (id: string) => shops.find(s => s.id === id)?.name || id;

  const triggerLabel =
    selectedShopIds.length === 0
      ? emptyLabel
      : `${selectedShopIds.length} Shop${selectedShopIds.length === 1 ? '' : 's'} ausgewählt`;

  return (
    <div className={cn('space-y-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              {triggerLabel}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover" align="start">
          <Command>
            <CommandInput placeholder={placeholder} />
            <CommandList>
              <CommandEmpty>Keine Shops gefunden.</CommandEmpty>
              <CommandGroup>
                {shops.map(shop => {
                  const checked = selectedShopIds.includes(shop.id);
                  return (
                    <CommandItem
                      key={shop.id}
                      value={shop.name}
                      onSelect={() => toggle(shop.id)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          checked ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <Store className="mr-2 h-4 w-4 text-muted-foreground" />
                      {shop.name}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedShopIds.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedShopIds.map(id => (
            <Badge key={id} variant="secondary" className="gap-1 pr-1">
              <Store className="h-3 w-3" />
              {getName(id)}
              <button
                type="button"
                onClick={() => remove(id)}
                className="ml-1 rounded-sm hover:bg-muted-foreground/20 p-0.5"
                aria-label={`${getName(id)} entfernen`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
