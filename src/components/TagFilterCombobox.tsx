import { useState } from "react";
import type { TagDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  maxTags?: number;
}

/**
 * Multi-select combobox for filtering by tags (AND logic).
 */
export function TagFilterCombobox({ value, onChange, allTags, isLoading, error, maxTags = 3 }: TagFilterComboboxProps) {
  const [open, setOpen] = useState(false);

  const handleToggleTag = (tag: TagDTO) => {
    const isSelected = value.some((t) => t.id === tag.id);

    if (isSelected) {
      onChange(value.filter((t) => t.id !== tag.id));
    } else {
      // Limit to maxTags
      if (value.length >= maxTags) {
        return;
      }
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
    return <div className="text-sm text-destructive">Błąd ładowania tagów: {error}</div>;
  }

  const maxReached = value.length >= maxTags;

  return (
    <div className="flex w-full items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Filtruj po tagach"
            className="h-11 flex-1 justify-between"
            disabled={isLoading}
          >
            <span className="flex items-center gap-2 truncate">
              {value.length > 0 ? (
                <>
                  {value.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="gap-1">
                      {tag.name}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTag(tag.id);
                        }}
                        className="rounded-full p-0.5 hover:bg-secondary-foreground/20"
                        aria-label={`Usuń tag ${tag.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </>
              ) : (
                <span className="text-muted-foreground">🏷️ Filtruj po tagach (max {maxTags})</span>
              )}
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
                {maxReached && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">Osiągnięto limit {maxTags} tagów</div>
                )}
                {allTags?.map((tag) => {
                  const isSelected = value.some((t) => t.id === tag.id);
                  const isDisabled = maxReached && !isSelected;
                  return (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => handleToggleTag(tag)}
                      disabled={isDisabled}
                      className={cn(isDisabled && "opacity-50")}
                    >
                      <div className="flex w-full items-center gap-2">
                        <Checkbox
                          checked={isSelected}
                          disabled={isDisabled}
                          onCheckedChange={() => handleToggleTag(tag)}
                          aria-label={`Wybierz tag ${tag.name}`}
                        />
                        <span className="flex-1">{tag.name}</span>
                        <Check className={cn("ml-auto h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
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
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClearAll}
          className="h-11 w-11 flex-shrink-0"
          aria-label="Wyczyść wszystkie tagi"
        >
          <X className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
