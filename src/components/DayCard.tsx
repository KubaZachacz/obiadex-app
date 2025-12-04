import type { DayPlanListItemDTO } from "@/types";
import { isToday, parseDateISO } from "@/lib/date/utils";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DayCardProps {
  day: string;
  plan?: DayPlanListItemDTO;
  onOpen: (day: string) => void;
  dimmed?: boolean;
}

/**
 * DayCard component displays a single day with its assigned dish.
 * Highlights today, dims days outside current week, condensed layout.
 */
export function DayCard({ day, plan, onOpen, dimmed = false }: DayCardProps) {
  const date = parseDateISO(day);
  const today = isToday(date);

  const dayName = date.toLocaleDateString("pl-PL", { weekday: "short" });
  const dayNumber = date.getDate();
  const fullDate = date.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const handleClick = () => {
    onOpen(day);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(day);
    }
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring py-1.5",
        today && "border-primary border-2",
        dimmed && "opacity-40"
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={plan ? `${dayName}, ${dayNumber} - ${plan.dish.name}` : `${dayName}, ${dayNumber} - Wybierz danie`}
    >
      <CardContent className="p-2">
        <div className="flex items-center gap-2">
          {/* Column 1: Date and day name */}
          <div className="flex-shrink-0 space-y-0.5 min-w-[3rem]">
            <div className="text-[10px] text-muted-foreground leading-tight">{fullDate}</div>
            <div className="text-sm font-bold uppercase leading-tight">{dayName}</div>
          </div>

          {/* Column 2: Dish name */}
          <div className="flex-1 min-w-0 flex items-center">
            {plan ? (
              <div className="text-xs font-medium line-clamp-1 leading-tight truncate">{plan.dish.name}</div>
            ) : (
              <div className="text-xs text-muted-foreground leading-tight">Wybierz</div>
            )}
          </div>

          {/* Column 3: "Dziś" tag */}
          {today && (
            <div className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-primary text-primary-foreground rounded whitespace-nowrap">
              Dziś
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
