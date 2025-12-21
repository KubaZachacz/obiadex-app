import type { DishListItemDTO } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DishPickerListProps {
  items: DishListItemDTO[];
  isLoading: boolean;
  onSelect: (dishId: string) => void;
  selectedId?: string;
  emptyVariant: "no-data" | "no-results";
}

/**
 * DishPickerList displays dishes sorted by usage_prio with single selection.
 * Shows dish name, last used date, and tags.
 */
export function DishPickerList({ items, isLoading, onSelect, selectedId, emptyVariant }: DishPickerListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          {emptyVariant === "no-data"
            ? "Brak dań w bazie. Dodaj pierwsze danie, aby rozpocząć."
            : "Brak dań z wybranymi tagami. Spróbuj zmienić filtry."}
        </p>
        {emptyVariant === "no-data" && (
          <a href="/dishes/new" className="text-sm text-primary hover:underline">
            Dodaj danie
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto" data-testid="dish-picker-list">
      {items.map((dish) => {
        const isSelected = selectedId === dish.id;

        return (
          <button
            key={dish.id}
            type="button"
            onClick={() => onSelect(dish.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(dish.id);
              }
            }}
            className={cn(
              "w-full p-4 border rounded-lg text-left transition-all",
              "hover:bg-accent hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSelected && "bg-accent border-primary border-2"
            )}
            aria-pressed={isSelected}
            aria-label={`Wybierz danie ${dish.name}`}
            data-testid="dish-picker-item"
            data-dish-id={dish.id}
            data-dish-name={dish.name}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium line-clamp-2">{dish.name}</h4>
                {isSelected && (
                  <Badge variant="default" className="shrink-0">
                    Wybrano
                  </Badge>
                )}
              </div>

              {dish.lastUsedDay && (
                <div className="text-xs text-muted-foreground">Ostatnio użyte: {formatDate(dish.lastUsedDay)}</div>
              )}

              {dish.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {dish.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Formats YYYY-MM-DD to local date string.
 */
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
