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
  isMobile: boolean;
}

/**
 * DayWeekView displays days in the prefetch range.
 * Desktop: 3 COLUMNS (weeks) × 7 ROWS (days Mon-Sun).
 * Mobile: single column stack.
 */
export function DayWeekView({ viewport, dayPlans, isLoading, onSelectDay, isMobile }: DayWeekViewProps) {
  const startDate = parseDateISO(viewport.prefetchStart);
  const endDate = parseDateISO(viewport.prefetchEnd);
  const allDays = generateDateRange(startDate, endDate);

  const skeletonCount = isMobile ? 11 : 21;

  // Check if day is in current week
  const currentWeekStart = parseDateISO(viewport.visibleStart);
  const currentWeekEnd = parseDateISO(viewport.visibleEnd);

  const isDayInCurrentWeek = (date: Date): boolean => {
    return date >= currentWeekStart && date <= currentWeekEnd;
  };

  // Group days by week (for desktop)
  const weeks: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  return (
    <div className="p-4">
      {/* Mobile: single column, days stack vertically */}
      {isMobile ? (
        <div className="flex flex-col gap-2">
          {isLoading
            ? Array.from({ length: skeletonCount }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
            : allDays.map((date) => {
                const day = formatDateISO(date);
                const plan = dayPlans[day];
                const isInCurrentWeek = isDayInCurrentWeek(date);

                return <DayCard key={day} day={day} plan={plan} onOpen={onSelectDay} dimmed={!isInCurrentWeek} />;
              })}
        </div>
      ) : (
        /* Desktop: 3 COLUMNS (weeks) × 7 ROWS (days) */
        <div className="grid grid-cols-3 gap-2">
          {isLoading
            ? // Show 3 weeks of skeletons
              Array.from({ length: 3 }).map((_, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-2">
                  {Array.from({ length: 7 }).map((_, dayIdx) => (
                    <Skeleton key={dayIdx} className="h-20 rounded-lg" />
                  ))}
                </div>
              ))
            : // Render weeks as columns
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
      )}
    </div>
  );
}
