import type { DayPlanDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";

interface DayPlanDetailsViewProps {
  dayPlan: DayPlanDTO;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

/**
 * Displays full details of a planned dish including recipe, URL, and tags.
 * Shows edit and delete actions.
 */
export function DayPlanDetailsView({ dayPlan, onEdit, onDelete, isDeleting }: DayPlanDetailsViewProps) {
  const { dish } = dayPlan;

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Dish name */}
      <div>
        <h3 className="text-lg font-semibold">{dish.name}</h3>
      </div>

      {/* Tags */}
      {dish.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {dish.tags.map((tag) => (
            <Badge key={tag.id} variant="secondary">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Recipe */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Przepis</h4>
          {dish.recipeText ? (
            <p className="whitespace-pre-wrap text-sm">{dish.recipeText}</p>
          ) : (
            <p className="text-sm italic text-muted-foreground">Brak przepisu</p>
          )}
        </div>
      </div>

      {/* URL */}
      {dish.url && (
        <div className="flex items-center gap-2 rounded-md border p-3">
          <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <a
            href={dish.url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-sm text-primary hover:underline"
          >
            {dish.url}
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onEdit} className="flex-1">
          <Pencil className="mr-2 h-4 w-4" />
          Zmień danie
        </Button>
        <Button variant="destructive" onClick={onDelete} disabled={isDeleting} className="flex-1">
          <Trash2 className="mr-2 h-4 w-4" />
          {isDeleting ? "Usuwanie..." : "Usuń"}
        </Button>
      </div>
    </div>
  );
}
