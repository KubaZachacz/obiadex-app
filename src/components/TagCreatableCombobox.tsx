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
import { CheckIcon, ChevronDownIcon, CloseIcon, PlusIcon, TrashIcon } from "@/components/icons";
import type { TagDTO } from "@/types";

interface TagCreatableComboboxProps {
  value: TagDTO[];
  onChange: (tags: TagDTO[]) => void;
  onCreate?: (name: string) => Promise<TagDTO>;
  onDelete?: (tag: TagDTO) => Promise<boolean>;
  options: TagDTO[];
  isLoading?: boolean;
  error?: string;
  className?: string;
  maxTags?: number;
  testId?: string;
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
  maxTags,
  testId,
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
  const testIdPrefix = testId ? `${testId}-` : "";

  const formatTestId = (value: string) => value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "");

  const normalizedSearch = search.toLowerCase().trim();
  const maxReached = maxTags !== undefined && safeValue.length >= maxTags;
  const canCreate =
    onCreate &&
    normalizedSearch.length >= 2 &&
    normalizedSearch.length <= 30 &&
    !options.some((tag) => tag.name.toLowerCase() === normalizedSearch) &&
    !maxReached;

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
      // Check maxTags limit
      if (maxReached) {
        return;
      }
      onChange([...safeValue, tag]);
    },
    [onChange, safeValue, selectedIds, maxReached]
  );

  const handleCreateTag = useCallback(async () => {
    if (!canCreate || isCreating || !onCreate) return;

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

  const handleRequestDelete = useCallback(
    (tag: TagDTO, event?: React.MouseEvent<HTMLButtonElement>) => {
      if (!onDelete) return;
      event?.preventDefault();
      event?.stopPropagation();
      setDeleteConfirm(tag);
    },
    [onDelete]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirm || isDeleting || !onDelete) return;

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
              data-testid={testId}
              onClick={(event) => {
                if (isTriggerDisabled) {
                  event.preventDefault();
                  event.stopPropagation();
                }
              }}
              onKeyDown={handleTriggerKeyDown}
            >
              <div className="flex flex-1 flex-wrap items-center gap-2">
                {safeValue.length === 0 && (
                  <span className="text-muted-foreground">
                    {maxTags
                      ? `🏷️ Wybierz tagi (max ${maxTags})`
                      : onCreate
                        ? "Wybierz lub utwórz tagi"
                        : "Wybierz tagi"}
                  </span>
                )}
                {safeValue.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
                    <span>{tag.name}</span>
                    <button
                      type="button"
                      className="rounded-full outline-none ring-offset-background transition hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-label={`Usuń tag ${tag.name} z dania`}
                      onClick={(event) => handleChipRemove(tag, event)}
                    >
                      <CloseIcon className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <ChevronDownIcon className="shrink-0 opacity-60" />
            </div>
          </PopoverTrigger>
          <PopoverContent id={popoverContentId} className="w-[min(420px,90vw)] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder={onCreate ? "Szukaj lub utwórz tag..." : "Szukaj tagu..."}
                value={search}
                onValueChange={setSearch}
                aria-label="Wyszukaj tag"
                data-testid={testId ? `${testIdPrefix}search` : undefined}
              />
              <CommandList>
                {isLoading && <CommandEmpty>Ładowanie tagów...</CommandEmpty>}
                {error && <CommandEmpty>Błąd wczytywania tagów</CommandEmpty>}
                {!isLoading && !error && (
                  <>
                    {canCreate && (
                      <CommandGroup heading="Utwórz">
                        <CommandItem
                          onSelect={handleCreateTag}
                          disabled={isCreating}
                          className="cursor-pointer"
                          data-testid={testId ? `${testIdPrefix}create` : undefined}
                        >
                          <PlusIcon />
                          <span>Utwórz &ldquo;{normalizedSearch}&rdquo;</span>
                        </CommandItem>
                      </CommandGroup>
                    )}

                    {maxReached && maxTags && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        Osiągnięto limit {maxTags} {maxTags === 1 ? "tagu" : maxTags < 5 ? "tagów" : "tagów"}
                      </div>
                    )}

                    {filteredOptions.length > 0 ? (
                      <CommandGroup heading="Dostępne tagi">
                        {filteredOptions.map((tag) => {
                          const isSelected = selectedIds.includes(tag.id);
                          const isDisabled = maxReached && !isSelected;

                          return (
                            <CommandItem
                              key={tag.id}
                              value={tag.name}
                              onSelect={() => handleToggleTag(tag)}
                              disabled={isDisabled}
                              className={cn("cursor-pointer", isDisabled && "opacity-50")}
                              data-testid={testId ? `${testIdPrefix}option-${formatTestId(tag.name)}` : undefined}
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
                                    {isSelected && <CheckIcon />}
                                  </span>
                                  <span className={cn("text-sm", isSelected && "font-semibold text-foreground")}>
                                    {tag.name}
                                  </span>
                                </span>
                                {onDelete && (
                                  <button
                                    type="button"
                                    className="rounded-md p-1 text-muted-foreground transition hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    aria-label={`Usuń tag ${tag.name} globalnie`}
                                    onClick={(event) => handleRequestDelete(tag, event)}
                                  >
                                    <TrashIcon />
                                  </button>
                                )}
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
