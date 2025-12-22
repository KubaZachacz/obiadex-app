import { useEffect, useRef, useState } from "react";
import type { DayPlanDTO } from "@/types";
import { useDishPicker } from "@/components/hooks/useDishPicker";
import { TagCreatableCombobox } from "./TagCreatableCombobox";
import { DishPickerList } from "./DishPickerList";
import { DayPlanDetailsView } from "./DayPlanDetailsView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { isToday, parseDateISO } from "@/lib/date/utils";
import { useMutation, useQuery } from "@/lib/http/hooks";

interface DayPlanOverlayProps {
  day: string | null;
  onClose: () => void;
  onSaved: () => void;
}

type OverlayMode = "view" | "edit";

/**
 * Routable overlay for viewing/selecting/changing a dish for a day.
 * Supports two modes:
 * - view: Display full dish details with edit/delete actions
 * - edit: Dish picker for selecting a new dish
 * Renders as Dialog on desktop, Drawer on mobile.
 */
export function DayPlanOverlay({ day, onClose, onSaved }: DayPlanOverlayProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mode, setMode] = useState<OverlayMode>("edit");
  const [existingPlan, setExistingPlan] = useState<DayPlanDTO | null>(null);
  const isOpen = day !== null;

  const {
    state,
    allTags,
    isLoadingTags,
    isLoadingDishes,
    error: dishPickerError,
    selectDish,
    setSelectedTags,
    setNameSearch,
    saveDayPlan,
    refetchDishes,
  } = useDishPicker(day || "");
  const latestRefetchDishes = useRef(refetchDishes);

  // Keep the refetch function reference up to date without retriggering other effects
  useEffect(() => {
    latestRefetchDishes.current = refetchDishes;
  }, [refetchDishes]);

  const { isLoading: isLoadingPlan } = useQuery<{ data: DayPlanDTO | null }>(day ? `/api/day-plans/${day}` : null, {
    enabled: !!day,
    onSuccess: (response) => {
      const dayPlan = response.data ?? null;
      setExistingPlan(dayPlan);
      setMode(dayPlan ? "view" : "edit");
    },
    onError: (apiError) => {
      if (apiError.status === 404) {
        setExistingPlan(null);
        setMode("edit");
        return;
      }
      setExistingPlan(null);
      setMode("edit");
    },
  });

  // Fetch existing day plan when overlay opens
  useEffect(() => {
    if (!day) {
      setExistingPlan(null);
      setMode("edit");
      return;
    }

    latestRefetchDishes.current();
  }, [day]);

  const deleteDayPlanMutation = useMutation<unknown, { day: string }>(
    (variables) => `/api/day-plans/${variables.day}`,
    {
      method: "DELETE",
      onSuccess: () => {
        onSaved();
        onClose();
      },
    }
  );

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle save action
  const handleSave = async () => {
    const success = await saveDayPlan();
    if (success) {
      // Refetch dishes after saving to update last used info
      refetchDishes();
      onSaved();
      onClose();
    }
  };

  // Handle delete action
  const handleDelete = async () => {
    if (!day) return;

    try {
      await deleteDayPlanMutation.mutateAsync({ day });
    } catch {
      return;
    }
  };

  // Handle edit mode switch
  const handleEdit = () => {
    setMode("edit");
  };

  // Format day for display
  const formatDayTitle = (dayStr: string): string => {
    const date = parseDateISO(dayStr);
    const today = isToday(date);
    const formatted = date.toLocaleDateString("pl-PL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return today ? `${formatted} (Dzisiaj)` : formatted;
  };

  const title = day ? formatDayTitle(day) : "";
  const description = mode === "view" ? "Szczegoly dania" : "Wybierz danie dla tego dnia";

  const emptyVariant = state.tags.length === 0 && state.dishes.length === 0 ? "no-data" : "no-results";

  // Content: View mode or Edit mode
  const content = isLoadingPlan ? (
    <div className="flex h-full flex-col gap-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  ) : mode === "view" && existingPlan ? (
    <DayPlanDetailsView
      dayPlan={existingPlan}
      onEdit={handleEdit}
      onDelete={handleDelete}
      isDeleting={deleteDayPlanMutation.isDeleting}
    />
  ) : (
    <div className="flex h-full flex-col gap-3">
      <div className="flex-shrink-0 space-y-3">
        <Input
          type="text"
          placeholder="Szukaj dania po nazwie..."
          value={state.nameSearch}
          onChange={(e) => setNameSearch(e.target.value)}
          className="h-11"
          data-testid="day-plan-search"
        />

        <TagCreatableCombobox
          value={state.tags}
          onChange={setSelectedTags}
          options={allTags}
          isLoading={isLoadingTags}
          maxTags={3}
          testId="day-plan-tags"
        />
      </div>

      <div className="min-h-0 flex-1" data-testid="day-plan-picker">
        <DishPickerList
          items={state.dishes}
          isLoading={isLoadingDishes}
          onSelect={selectDish}
          selectedId={state.selectedId}
          emptyVariant={emptyVariant}
        />
      </div>

      {dishPickerError && <div className="flex-shrink-0 text-sm text-destructive">{dishPickerError}</div>}
    </div>
  );

  // Footer: Only show in edit mode
  const footer =
    mode === "edit" ? (
      <>
        <Button variant="outline" onClick={onClose} disabled={state.saving} data-testid="day-plan-cancel">
          Anuluj
        </Button>
        <Button onClick={handleSave} disabled={!state.selectedId || state.saving} data-testid="day-plan-save">
          {state.saving ? "Zapisywanie..." : "Zapisz"}
        </Button>
      </>
    ) : null;

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="!max-h-[96vh] flex h-[96vh] flex-col" data-testid="day-plan-overlay">
          <DrawerHeader className="flex-shrink-0 pb-3">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 flex-1 px-4 pb-4">{content}</div>

          {footer && <DrawerFooter className="flex-shrink-0 flex-row gap-2">{footer}</DrawerFooter>}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[95vh] max-w-2xl flex-col" data-testid="day-plan-overlay">
        <DialogHeader className="flex-shrink-0 pb-3">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1">{content}</div>

        {footer && <DialogFooter className="flex-shrink-0">{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
