import { useCallback, useRef, useState } from "react";
import { formatWeekRange, getWeekStart, getWeekEnd } from "@/lib/date/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WeekNavigatorProps {
  weekIndex: number;
  onChange: (nextIndex: number) => void;
  locale?: string;
}

/**
 * WeekNavigator component with prev/next buttons and swipe gesture support on mobile.
 */
export function WeekNavigator({ weekIndex, onChange, locale = "pl-PL" }: WeekNavigatorProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const weekStart = getWeekStart(weekIndex);
  const weekEnd = getWeekEnd(weekIndex);
  const rangeLabel = formatWeekRange(weekStart, weekEnd, locale);

  const handlePrevious = useCallback(() => {
    if (isNavigating) return;
    setIsNavigating(true);
    onChange(weekIndex - 1);
    setTimeout(() => setIsNavigating(false), 300);
  }, [weekIndex, onChange, isNavigating]);

  const handleNext = useCallback(() => {
    if (isNavigating) return;
    setIsNavigating(true);
    onChange(weekIndex + 1);
    setTimeout(() => setIsNavigating(false), 300);
  }, [weekIndex, onChange, isNavigating]);

  // Touch gesture handlers for mobile swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;

    const deltaX = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 50;

    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe left → next week
        handleNext();
      } else {
        // Swipe right → previous week
        handlePrevious();
      }
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  }, [handleNext, handlePrevious]);

  return (
    <div
      className="sticky top-14 z-40 bg-background flex items-center justify-between gap-4 px-4 lg:py-3 py-1 border-b"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrevious}
        disabled={isNavigating}
        aria-label="Poprzedni tydzień"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="flex-1 text-center">
        <span className="lg:text-sm text-xs font-medium" aria-live="polite">
          {rangeLabel}
        </span>
      </div>

      <Button variant="ghost" size="icon" onClick={handleNext} disabled={isNavigating} aria-label="Następny tydzień">
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
