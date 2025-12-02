import { useState, useCallback, useMemo, useId } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { TagDTO } from "@/types";

interface TagCreatableComboboxProps {
  value: TagDTO[];
  onChange: (tags: TagDTO[]) => void;
  onCreate: (name: string) => Promise<TagDTO>;
  onDelete: (tag: TagDTO) => Promise<boolean>;
  options: TagDTO[];
  isLoading?: boolean;
  error?: string;
  className?: string;
}

export function TagCreatableCombobox({
  value,
  onChange,
  onCreate,
  onDelete,
  options,
  isLoading = false,
  error,
  className,
}: TagCreatableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<TagDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const safeValue = useMemo(() => value || [], [value]);
  const selectedIds = useMemo(() => safeValue.map((tag) => tag.id), [safeValue]);
  const popoverContentId = useId();

  const normalizedSearch = search.toLowerCase().trim();
  const canCreate =
    normalizedSearch.length >= 2 &&
    normalizedSearch.length <= 30 &&
    !options.some((tag) => tag.name.toLowerCase() === normalizedSearch);

  const filteredOptions = useMemo(() => {
    if (!normalizedSearch) {
      return options;
    }
    return options.filter((tag) => tag.name.toLowerCase().includes(normalizedSearch));
  }, [normalizedSearch, options]);

  const handleToggleTag = useCallback(
    (tag: TagDTO) => {
      if (selectedIds.includes(tag.id)) {
        onChange(safeValue.filter((t) => t.id !== tag.id));
        return;
      }
      onChange([...safeValue, tag]);
    },
    [onChange, safeValue, selectedIds]
  );

  const handleCreateTag = useCallback(async () => {
    if (!canCreate || isCreating) return;

    setIsCreating(true);
    try {
      const newTag = await onCreate(normalizedSearch);
      onChange([...safeValue, newTag]);
      setSearch("");
      setActionError(null);
    } catch {
      setActionError("Nie udało się utworzyć tagu. Spróbuj ponownie.");
    } finally {
      setIsCreating(false);
    }
  }, [canCreate, isCreating, normalizedSearch, onCreate, safeValue, onChange]);

  const handleChipRemove = useCallback(
    (tag: TagDTO, event?: React.MouseEvent<HTMLButtonElement>) => {
      event?.stopPropagation();
      onChange(safeValue.filter((t) => t.id !== tag.id));
    },
    [onChange, safeValue]
  );

  const handleRequestDelete = useCallback((tag: TagDTO, event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    event?.stopPropagation();
    setDeleteConfirm(tag);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirm || isDeleting) return;

    setIsDeleting(true);
    try {
      const success = await onDelete(deleteConfirm);
      if (success) {
        onChange(safeValue.filter((tag) => tag.id !== deleteConfirm.id));
      }
      setActionError(null);
    } catch {
      setActionError("Nie udało się usunąć tagu. Spróbuj ponownie.");
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  }, [deleteConfirm, isDeleting, onDelete, onChange, safeValue]);

  const handleCancelDelete = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  const isTriggerDisabled = isLoading;

  const handleTriggerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (isTriggerDisabled) return;

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }

      if (event.key === "ArrowDown" && !open) {
        event.preventDefault();
        setOpen(true);
      }

      if (event.key === "Escape" && open) {
        event.preventDefault();
        setOpen(false);
      }
    },
    [isTriggerDisabled, open]
  );

  return (
    <>
      <div className={cn("space-y-2", className)}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div
              role="combobox"
              tabIndex={isTriggerDisabled ? -1 : 0}
              aria-expanded={open}
              aria-label="Wybierz tagi"
              aria-controls={popoverContentId}
              aria-disabled={isTriggerDisabled ? "true" : undefined}
              aria-haspopup="listbox"
              className={cn(
                "border-input bg-background text-foreground placeholder:text-muted-foreground flex w-full min-h-10 cursor-pointer items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm shadow-sm ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isTriggerDisabled && "cursor-not-allowed opacity-75"
              )}
              data-disabled={isTriggerDisabled ? "" : undefined}
              onClick={(event) => {
                if (isTriggerDisabled) {
                  event.preventDefault();
                  event.stopPropagation();
                }
              }}
              onKeyDown={handleTriggerKeyDown}
            >
              <div className="flex flex-1 flex-wrap items-center gap-2">
                {safeValue.length === 0 && <span className="text-muted-foreground">Wybierz lub wpisz tagi</span>}
                {safeValue.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
                    <span>{tag.name}</span>
                    <button
                      type="button"
                      className="rounded-full outline-none ring-offset-background transition hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-label={`Usuń tag ${tag.name} z dania`}
                      onClick={(event) => handleChipRemove(tag, event)}
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
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-4 shrink-0 opacity-60"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </PopoverTrigger>
          <PopoverContent id={popoverContentId} className="w-[min(420px,90vw)] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Szukaj lub utwórz tag..."
                value={search}
                onValueChange={setSearch}
                aria-label="Wyszukaj tag"
              />
              <CommandList>
                {isLoading && <CommandEmpty>Ładowanie tagów...</CommandEmpty>}
                {error && <CommandEmpty>Błąd wczytywania tagów</CommandEmpty>}
                {!isLoading && !error && (
                  <>
                    {canCreate && (
                      <CommandGroup heading="Utwórz">
                        <CommandItem onSelect={handleCreateTag} disabled={isCreating} className="cursor-pointer">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="size-4"
                            aria-hidden="true"
                          >
                            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                          </svg>
                          <span>Utwórz &ldquo;{normalizedSearch}&rdquo;</span>
                        </CommandItem>
                      </CommandGroup>
                    )}

                    {filteredOptions.length > 0 ? (
                      <CommandGroup heading="Dostępne tagi">
                        {filteredOptions.map((tag) => {
                          const isSelected = selectedIds.includes(tag.id);

                          return (
                            <CommandItem
                              key={tag.id}
                              value={tag.name}
                              onSelect={() => handleToggleTag(tag)}
                              className="cursor-pointer"
                            >
                              <div className="flex w-full items-center justify-between gap-2">
                                <span className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "inline-flex size-5 items-center justify-center rounded-full border text-[10px] font-semibold",
                                      isSelected
                                        ? "border-primary bg-primary/15 text-primary"
                                        : "border-muted-foreground/30 text-muted-foreground"
                                    )}
                                    aria-hidden="true"
                                  >
                                    {isSelected && (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className="size-3"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.704 5.29a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3.25-3.25a1 1 0 011.414-1.414L8.75 11.836l6.543-6.543a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    )}
                                  </span>
                                  <span className={cn("text-sm", isSelected && "font-semibold text-foreground")}>
                                    {tag.name}
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  className="rounded-md p-1 text-muted-foreground transition hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  aria-label={`Usuń tag ${tag.name} globalnie`}
                                  onClick={(event) => handleRequestDelete(tag, event)}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="size-4"
                                    aria-hidden="true"
                                  >
                                    <path d="M3 6h18" />
                                    <path d="M8 6V4h8v2" />
                                    <path d="M10 11v6" />
                                    <path d="M14 11v6" />
                                    <path d="M5 6h14l-1 13a2 2 0 01-2 2H8a2 2 0 01-2-2l-1-13z" />
                                  </svg>
                                </button>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    ) : (
                      <CommandEmpty>Brak tagów</CommandEmpty>
                    )}
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {actionError && <p className="text-sm text-destructive">{actionError}</p>}
      </div>

      <Dialog open={deleteConfirm !== null} onOpenChange={(nextOpen) => !nextOpen && handleCancelDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usunąć tag?</DialogTitle>
            <DialogDescription>
              Tag &ldquo;{deleteConfirm?.name}&rdquo; zostanie usunięty globalnie. Ta operacja jest nieodwracalna.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete} disabled={isDeleting}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? "Usuwanie..." : "Usuń tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
