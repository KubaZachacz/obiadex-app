import { useState, useEffect, useCallback, useMemo } from "react";
import type { DayPlanListItemDTO, DayPlanRangeResponse } from "@/types";
import { WEEK_NAV_OFFSETS } from "@/lib/date/constants";
import { formatDateISO, getWeekStart, getWeekEnd, addDays, addWeeks } from "@/lib/date/utils";
import { useQuery } from "@/lib/http/hooks";

export interface WeekViewport {
  weekIndex: number;
  visibleStart: string;
  visibleEnd: string;
  prefetchStart: string;
  prefetchEnd: string;
}

interface UseWeekViewportReturn {
  weekIndex: number;
  viewport: WeekViewport;
  dayPlans: Record<string, DayPlanListItemDTO>;
  isLoading: boolean;
  error: string | null;
  setWeekIndex: (index: number) => void;
  refetch: () => void;
}

/**
 * Simple mobile detection - only used for viewport calculations, not layout.
 */
function getIsMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

/**
 * Custom hook for managing week viewport state, caching day plans,
 * and fetching data with configurable offsets for desktop/mobile.
 */
export function useWeekViewport(): UseWeekViewportReturn {
  const [weekIndex, setWeekIndex] = useState(0);
  const [dayPlans, setDayPlans] = useState<Record<string, DayPlanListItemDTO>>({});
  const [error, setError] = useState<string | null>(null);

  // Calculate viewport based on weekIndex - check mobile on each call
  const calculateViewport = useCallback((index: number): WeekViewport => {
    const baseDate = new Date();
    const weekStart = getWeekStart(index, baseDate);
    const weekEnd = getWeekEnd(index, baseDate);

    const visibleStart = formatDateISO(weekStart);
    const visibleEnd = formatDateISO(weekEnd);

    const isMobile = getIsMobile();

    let prefetchStart: string;
    let prefetchEnd: string;

    if (isMobile) {
      // Mobile: +/-2 days from visible range
      const { prevDays, nextDays } = WEEK_NAV_OFFSETS.mobile;
      prefetchStart = formatDateISO(addDays(weekStart, -prevDays));
      prefetchEnd = formatDateISO(addDays(weekEnd, nextDays));
    } else {
      // Desktop: +/-1 week from visible range
      const { prevWeeks, nextWeeks } = WEEK_NAV_OFFSETS.desktop;
      prefetchStart = formatDateISO(addWeeks(weekStart, -prevWeeks));
      prefetchEnd = formatDateISO(addWeeks(weekEnd, nextWeeks));
    }

    return {
      weekIndex: index,
      visibleStart,
      visibleEnd,
      prefetchStart,
      prefetchEnd,
    };
  }, []);

  const [viewport, setViewport] = useState<WeekViewport>(() => calculateViewport(0));

  // Update viewport when weekIndex changes or window resizes (mobile <-> desktop)
  useEffect(() => {
    setViewport(calculateViewport(weekIndex));

    const handleResize = () => {
      setViewport(calculateViewport(weekIndex));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [weekIndex, calculateViewport]);

  const dayPlansUrl = useMemo(() => {
    const params = new URLSearchParams({
      start: viewport.prefetchStart,
      end: viewport.prefetchEnd,
      sort: "asc",
    });

    return `/api/day-plans?${params.toString()}`;
  }, [viewport.prefetchEnd, viewport.prefetchStart]);

  const dayPlansQuery = useQuery<DayPlanRangeResponse>(dayPlansUrl, {
    debounce: 300,
    onSuccess: (data) => {
      setError(null);
      const cache: Record<string, DayPlanListItemDTO> = {};
      for (const plan of data.data) {
        cache[plan.day] = plan;
      }
      setDayPlans(cache);
    },
    onError: (apiError) => {
      setError(apiError.message);
    },
  });

  return {
    weekIndex,
    viewport,
    dayPlans,
    isLoading: dayPlansQuery.isLoading,
    error,
    setWeekIndex,
    refetch: () => {
      dayPlansQuery.refetch().catch(() => {
        return;
      });
    },
  };
}
