import type { DayPlanListItemDTO } from "@/types";
import type { WeekViewport } from "@/components/hooks/useWeekViewport";
import { formatDateISO, parseDateISO, generateDateRange } from "@/lib/date/utils";
import { DayCard } from "./DayCard";
import { Skeleton } from "@/components/ui/skeleton";

interface DayWeekViewProps {
  viewport: WeekViewport;
  dayPlans: Record<string, DayPlanListItemDTO>;
  isLoading: boolean;
  onSelectDay: (day: string) => void;
}

/**
 * DayWeekView displays days in the prefetch range.
 * Desktop: 3 COLUMNS (weeks) × 7 ROWS (days Mon-Sun).
 * Mobile: single column stack.
 * Uses CSS-only responsive design - no JavaScript mobile detection needed.
 */
export function DayWeekView({ viewport, dayPlans, isLoading, onSelectDay }: DayWeekViewProps) {
  const startDate = parseDateISO(viewport.prefetchStart);
  const endDate = parseDateISO(viewport.prefetchEnd);
  const allDays = generateDateRange(startDate, endDate);

  // Check if day is in current week
  const currentWeekStart = parseDateISO(viewport.visibleStart);
  const currentWeekEnd = parseDateISO(viewport.visibleEnd);

  const isDayInCurrentWeek = (date: Date): boolean => {
    return date >= currentWeekStart && date <= currentWeekEnd;
  };

  // Group days by week
  const weeks: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  return (
    <div className="p-4" data-testid="day-week-view">
      {/* Mobile: flex-col stacks weeks vertically, Desktop: grid-cols-3 shows 3 week columns */}
      <div className="flex flex-col gap-2 md:grid md:grid-cols-3">
        {isLoading
          ? // Skeletons: 3 weeks × 7 days each
            Array.from({ length: 3 }).map((_, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-2">
                {Array.from({ length: 7 }).map((_, dayIdx) => (
                  <Skeleton key={dayIdx} className="h-20 rounded-lg" />
                ))}
              </div>
            ))
          : // Render weeks - CSS handles mobile (stacked) vs desktop (3 columns)
            weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-2">
                {week.map((date) => {
                  const day = formatDateISO(date);
                  const plan = dayPlans[day];
                  const isInCurrentWeek = isDayInCurrentWeek(date);

                  return <DayCard key={day} day={day} plan={plan} onOpen={onSelectDay} dimmed={!isInCurrentWeek} />;
                })}
              </div>
            ))}
      </div>
    </div>
  );
}
