import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { TagListItemDTO } from "@/types";

interface TagFilterComboboxProps {
  value: string[];
  onChange: (tagIds: string[]) => void;
  options: TagListItemDTO[];
  isLoading?: boolean;
  error?: string;
  className?: string;
}

export function TagFilterCombobox({
  value,
  onChange,
  options,
  isLoading = false,
  error,
  className,
}: TagFilterComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedTags = options.filter((tag) => value.includes(tag.id));
  const unselectedTags = options.filter((tag) => !value.includes(tag.id));

  const handleToggleTag = (tagId: string) => {
    if (value.includes(tagId)) {
      onChange(value.filter((id) => id !== tagId));
    } else {
      onChange([...value, tagId]);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(value.filter((id) => id !== tagId));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Filtruj według tagów"
            className="w-full justify-between"
            disabled={isLoading}
          >
            <span className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-4"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.5 3A2.5 2.5 0 003 5.5v2.879a2.5 2.5 0 00.732 1.767l6.5 6.5a2.5 2.5 0 003.536 0l2.878-2.878a2.5 2.5 0 000-3.536l-6.5-6.5A2.5 2.5 0 008.38 3H5.5zM6 7a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              {value.length > 0 ? `Wybrano: ${value.length}` : "Filtruj według tagów"}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-4 shrink-0 opacity-50"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Szukaj tagu..." />
            <CommandList>
              {isLoading && <CommandEmpty>Ładowanie tagów...</CommandEmpty>}
              {error && <CommandEmpty>Błąd wczytywania tagów</CommandEmpty>}
              {!isLoading && !error && options.length === 0 && <CommandEmpty>Brak tagów</CommandEmpty>}
              {!isLoading && !error && options.length > 0 && (
                <>
                  <CommandEmpty>Nie znaleziono tagu</CommandEmpty>
                  <CommandGroup>
                    {unselectedTags.map((tag) => (
                      <CommandItem key={tag.id} value={tag.name} onSelect={() => handleToggleTag(tag.id)}>
                        <div className="flex w-full items-center justify-between">
                          <span>{tag.name}</span>
                          {tag.dishCount !== undefined && (
                            <span className="text-xs text-muted-foreground">({tag.dishCount})</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedTags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="gap-1">
              {tag.name}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                className="ml-1 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={`Usuń tag ${tag.name}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-3"
                  aria-hidden="true"
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={handleClearAll} className="h-7 px-2 text-xs">
            Wyczyść wszystkie
          </Button>
        </div>
      )}
    </div>
  );
}
