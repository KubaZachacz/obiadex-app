import { useState } from "react";
import type { TagDTO } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagFilterComboboxProps {
  value: TagDTO[];
  onChange: (tags: TagDTO[]) => void;
  allTags: TagDTO[];
  isLoading: boolean;
  error?: string;
}

/**
 * Multi-select combobox for filtering by tags (AND logic).
 */
export function TagFilterCombobox({
  value,
  onChange,
  allTags,
  isLoading,
  error,
}: TagFilterComboboxProps) {
  const [open, setOpen] = useState(false);

  const handleToggleTag = (tag: TagDTO) => {
    const isSelected = value.some((t) => t.id === tag.id);

    if (isSelected) {
      onChange(value.filter((t) => t.id !== tag.id));
    } else {
      onChange([...value, tag]);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(value.filter((t) => t.id !== tagId));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  if (error) {
    return (
      <div className="text-sm text-destructive">
        Błąd ładowania tagów: {error}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Filtruj po tagach"
            className="w-full justify-between"
            disabled={isLoading}
          >
            <span className="truncate">
              {value.length > 0
                ? `Wybrano tagów: ${value.length}`
                : "Filtruj po tagach"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Szukaj tagu..." />
            <CommandList>
              <CommandEmpty>Nie znaleziono tagów.</CommandEmpty>
              <CommandGroup>
                {allTags?.map((tag) => {
                  const isSelected = value.some((t) => t.id === tag.id);
                  return (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => handleToggleTag(tag)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleTag(tag)}
                          aria-label={`Wybierz tag ${tag.name}`}
                        />
                        <span className="flex-1">{tag.name}</span>
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {value.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="gap-1">
              {tag.name}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                aria-label={`Usuń tag ${tag.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-6 text-xs"
          >
            Wyczyść wszystkie
          </Button>
        </div>
      )}
    </div>
  );
}
