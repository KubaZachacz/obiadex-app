import { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DishListItemDTO } from "@/types";
import { Trash2 } from "lucide-react";
import { EditIcon, ExternalLinkIcon } from "@/components/icons";
import { useMutation } from "@/lib/http/hooks";

interface DishCardProps {
  dish: DishListItemDTO;
  onEdit: (id: string) => void;
  onDeleteSuccess?: (id: string) => void;
}

export function DishCard({ dish, onEdit, onDeleteSuccess }: DishCardProps) {
  const hasRecipe = dish.recipeText && dish.recipeText.length > 0;
  const hasUrl = dish.url && dish.url.length > 0;
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { mutateAsync, isDeleting, error, reset } = useMutation<unknown, { id: string }>(
    (variables) => `/api/dishes/${variables.id}`,
    {
      method: "DELETE",
      onSuccess: () => {
        setIsDialogOpen(false);
        onDeleteSuccess?.(dish.id);
      },
    }
  );

  const handleDialogChange = useCallback(
    (open: boolean) => {
      if (isDeleting && open) {
        return;
      }
      setIsDialogOpen(open);
      if (!open) {
        reset();
      }
    },
    [isDeleting, reset]
  );

  const handleDelete = useCallback(async () => {
    try {
      await mutateAsync({ id: dish.id });
    } catch {
      return;
    }
  }, [dish.id, mutateAsync]);

  return (
    <>
      <Card
        className="overflow-hidden transition-shadow hover:shadow-md"
        data-testid="dish-card"
        data-dish-id={dish.id}
        data-dish-name={dish.name}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg" data-testid="dish-card-name">
              {dish.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDialogChange(true)}
                aria-label={`Usun danie ${dish.name}`}
                data-testid="dish-delete-trigger"
              >
                <Trash2 className="size-4 text-red-500" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(dish.id)}
                className="shrink-0"
                aria-label={`Edytuj danie ${dish.name}`}
                data-testid="dish-edit-trigger"
              >
                <EditIcon />
                Edytuj
              </Button>
            </div>
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
                  <ExternalLinkIcon />
                  Link do przepisu
                </a>
              )}
            </div>
          )}

          {dish.lastUsedDay && (
            <p className="text-xs text-muted-foreground">
              Ostatnio uzyte: {new Date(dish.lastUsedDay).toLocaleDateString("pl-PL")}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-sm" data-testid="dish-delete-dialog">
          <DialogHeader>
            <DialogTitle>Usun danie</DialogTitle>
            <DialogDescription>Czy na pewno chcesz usunac to danie? Tej operacji nie da sie cofnac.</DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error.message}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogChange(false)} disabled={isDeleting}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} data-testid="dish-delete-confirm">
              {isDeleting ? "Usuwanie..." : "Usun danie"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
