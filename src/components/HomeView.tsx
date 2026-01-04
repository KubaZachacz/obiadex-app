import { useEffect, useState } from "react";
import { useWeekViewport } from "@/components/hooks/useWeekViewport";
import { useAddDishDialog } from "@/components/hooks/useAddDishDialog";
import { WeekNavigator } from "./WeekNavigator";
import { DayWeekView } from "./DayWeekView";
import { DayPlanOverlay } from "./DayPlanOverlay";
import { DishEditorOverlay } from "./DishEditorOverlay";
import { FAB } from "./FAB";
import { WelcomeModal } from "./WelcomeModal";

/**
 * HomeView component - main view for weekly day plan list.
 * Manages week navigation, day selection, and overlay routing via query params.
 */
export function HomeView() {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const { isOpen: isAddDishOpen, open: openAddDish, close: closeAddDish } = useAddDishDialog();

  const { weekIndex, viewport, dayPlans, isLoading, error, setWeekIndex, refetch } = useWeekViewport();

  // Sync URL query param with selectedDay state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dayParam = params.get("day");

    if (dayParam && /^\d{4}-\d{2}-\d{2}$/.test(dayParam)) {
      setSelectedDay(dayParam);
    } else {
      setSelectedDay(null);
    }
  }, []);

  // Handle day selection - update URL query param
  const handleSelectDay = (day: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("day", day);
    window.history.pushState({}, "", url.toString());
    setSelectedDay(day);
  };

  // Handle overlay close - remove URL query param
  const handleCloseOverlay = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("day");
    window.history.pushState({}, "", url.toString());
    setSelectedDay(null);
  };

  // Handle successful save - refresh day plans
  const handleSaved = () => {
    refetch();
  };

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const dayParam = params.get("day");

      if (dayParam && /^\d{4}-\d{2}-\d{2}$/.test(dayParam)) {
        setSelectedDay(dayParam);
      } else {
        setSelectedDay(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Handle FAB click - open add dish dialog
  const handleAddDish = () => {
    openAddDish();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <WeekNavigator weekIndex={weekIndex} onChange={setWeekIndex} />

      {error && (
        <div className="p-4">
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            <p className="text-sm font-medium">Błąd ładowania danych</p>
            <p className="text-sm">{error}</p>
            <button onClick={refetch} className="mt-2 text-sm underline hover:no-underline">
              Spróbuj ponownie
            </button>
          </div>
        </div>
      )}

      <DayWeekView viewport={viewport} dayPlans={dayPlans} isLoading={isLoading} onSelectDay={handleSelectDay} />

      <DayPlanOverlay day={selectedDay} onClose={handleCloseOverlay} onSaved={handleSaved} />

      <DishEditorOverlay mode="create" isOpen={isAddDishOpen} onClose={closeAddDish} />

      <FAB onClick={handleAddDish} label="Dodaj danie" />

      <WelcomeModal />
    </div>
  );
}
