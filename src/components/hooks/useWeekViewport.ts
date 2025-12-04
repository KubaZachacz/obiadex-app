import { useState, useEffect, useCallback, useRef } from "react";
import type { DayPlanListItemDTO, DayPlanRangeResponse } from "@/types";
import { WEEK_NAV_OFFSETS } from "@/lib/date/constants";
import {
  formatDateISO,
  getWeekStart,
  getWeekEnd,
  addDays,
  addWeeks,
} from "@/lib/date/utils";

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
  isMobile: boolean;
  setWeekIndex: (index: number) => void;
  refetch: () => void;
}

/**
 * Detects if the viewport is mobile based on window width.
 */
function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768; // md breakpoint
}

/**
 * Custom hook for managing week viewport state, caching day plans,
 * and fetching data with configurable offsets for desktop/mobile.
 */
export function useWeekViewport(): UseWeekViewportReturn {
  const [weekIndex, setWeekIndex] = useState(0);
  const [dayPlans, setDayPlans] = useState<Record<string, DayPlanListItemDTO>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Initialize as false to avoid hydration mismatch (will update after mount)
  const [isMobile, setIsMobile] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update mobile detection on mount and resize
  useEffect(() => {
    // Set initial value after mount to avoid hydration mismatch
    setIsMobile(isMobileViewport());

    const handleResize = () => {
      setIsMobile(isMobileViewport());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate viewport based on weekIndex and device type
  const calculateViewport = useCallback(
    (index: number): WeekViewport => {
      const baseDate = new Date();
      const weekStart = getWeekStart(index, baseDate);
      const weekEnd = getWeekEnd(index, baseDate);

      const visibleStart = formatDateISO(weekStart);
      const visibleEnd = formatDateISO(weekEnd);

      let prefetchStart: string;
      let prefetchEnd: string;

      if (isMobile) {
        // Mobile: ±2 days from visible range
        const { prevDays, nextDays } = WEEK_NAV_OFFSETS.mobile;
        prefetchStart = formatDateISO(addDays(weekStart, -prevDays));
        prefetchEnd = formatDateISO(addDays(weekEnd, nextDays));
      } else {
        // Desktop: ±1 week from visible range
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
    },
    [isMobile]
  );

  const [viewport, setViewport] = useState<WeekViewport>(() => calculateViewport(0));

  // Update viewport when weekIndex or isMobile changes
  useEffect(() => {
    setViewport(calculateViewport(weekIndex));
  }, [weekIndex, calculateViewport]);

  // Fetch day plans for the current viewport
  const fetchDayPlans = useCallback(
    async (signal: AbortSignal) => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({
          start: viewport.prefetchStart,
          end: viewport.prefetchEnd,
          sort: "asc",
        });

        const response = await fetch(`/api/day-plans?${params.toString()}`, {
          signal,
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = "/login";
            return;
          }
          throw new Error(`Failed to fetch day plans: ${response.status}`);
        }

        const data: DayPlanRangeResponse = await response.json();

        // Convert array to cache map
        const cache: Record<string, DayPlanListItemDTO> = {};
        for (const plan of data.data) {
          cache[plan.day] = plan;
        }

        setDayPlans(cache);
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === "AbortError") return;
          setError(err.message);
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [viewport.prefetchStart, viewport.prefetchEnd]
  );

  // Debounced fetch effect
  useEffect(() => {
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Debounce fetch by 300ms
    debounceTimerRef.current = setTimeout(() => {
      fetchDayPlans(controller.signal);
    }, 300);

    return () => {
      controller.abort();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fetchDayPlans]);

  const refetch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    fetchDayPlans(controller.signal);
  }, [fetchDayPlans]);

  return {
    weekIndex,
    viewport,
    dayPlans,
    isLoading,
    error,
    isMobile,
    setWeekIndex,
    refetch,
  };
}
