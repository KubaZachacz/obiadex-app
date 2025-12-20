import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DishListItemDTO } from "@/types";
import { cn } from "@/lib/utils";
import { DishCard } from "./DishCard";

interface DishListProps {
  items: DishListItemDTO[];
  onEdit: (id: string) => void;
  onDeleteSuccess?: (id: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function DishList({ items, onEdit, onDeleteSuccess, isLoading = false, className }: DishListProps) {
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
        <DishCard key={dish.id} dish={dish} onEdit={onEdit} onDeleteSuccess={onDeleteSuccess} />
      ))}
    </div>
  );
}
