import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DishListItemDTO } from "@/types";
import { cn } from "@/lib/utils";

interface DishListItemProps {
  dish: DishListItemDTO;
  onEdit: (id: string) => void;
}

export function DishListItem({ dish, onEdit }: DishListItemProps) {
  const hasRecipe = dish.recipeText && dish.recipeText.length > 0;
  const hasUrl = dish.url && dish.url.length > 0;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{dish.name}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(dish.id)}
            className="shrink-0"
            aria-label={`Edytuj danie ${dish.name}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-4"
              aria-hidden="true"
            >
              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
            </svg>
            Edytuj
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {dish.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {dish.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-xs">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {(hasRecipe || hasUrl) && (
          <div className="space-y-2 text-sm">
            {hasRecipe && dish.recipeText && (
              <p className="line-clamp-2 text-muted-foreground">
                {dish.recipeText.substring(0, 150)}
                {dish.recipeText.length > 150 ? "..." : ""}
              </p>
            )}

            {hasUrl && dish.url && (
              <a
                href={dish.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-4"
                  aria-hidden="true"
                >
                  <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
                  <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
                </svg>
                Link do przepisu
              </a>
            )}
          </div>
        )}

        {dish.lastUsedDay && (
          <p className="text-xs text-muted-foreground">
            Ostatnio użyte: {new Date(dish.lastUsedDay).toLocaleDateString("pl-PL")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface DishListProps {
  items: DishListItemDTO[];
  onEdit: (id: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function DishList({ items, onEdit, isLoading = false, className }: DishListProps) {
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-6 w-3/4 rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <div className="h-5 w-16 rounded-full bg-muted" />
                <div className="h-5 w-20 rounded-full bg-muted" />
              </div>
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-2/3 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {items.map((dish) => (
        <DishListItem key={dish.id} dish={dish} onEdit={onEdit} />
      ))}
    </div>
  );
}
