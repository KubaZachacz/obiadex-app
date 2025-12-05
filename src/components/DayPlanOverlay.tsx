import { useEffect, useState } from "react";
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
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isOpen = day !== null;

  const { state, allTags, isLoadingTags, selectDish, setSelectedTags, setNameSearch, saveDayPlan } = useDishPicker(
    day || ""
  );

  // Fetch existing day plan when overlay opens
  useEffect(() => {
    if (!day) {
      setExistingPlan(null);
      setMode("edit");
      return;
    }

    const fetchDayPlan = async () => {
      setIsLoadingPlan(true);
      try {
        const response = await fetch(`/api/day-plans/${day}`);
        if (response.ok) {
          const data = await response.json();
          setExistingPlan(data.data);
          setMode("view");
        } else if (response.status === 404) {
          // No plan exists, go to edit mode
          setExistingPlan(null);
          setMode("edit");
        } else {
          console.error("Failed to fetch day plan:", response.statusText);
          setExistingPlan(null);
          setMode("edit");
        }
      } catch (error) {
        console.error("Error fetching day plan:", error);
        setExistingPlan(null);
        setMode("edit");
      } finally {
        setIsLoadingPlan(false);
      }
    };

    fetchDayPlan();
  }, [day]);

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
      onSaved();
      onClose();
    }
  };

  // Handle delete action
  const handleDelete = async () => {
    if (!day) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/day-plans/${day}`, {
        method: "DELETE",
      });

      if (response.ok || response.status === 204) {
        onSaved();
        onClose();
      } else {
        console.error("Failed to delete day plan:", response.statusText);
      }
    } catch (error) {
      console.error("Error deleting day plan:", error);
    } finally {
      setIsDeleting(false);
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
  const description = mode === "view" ? "Szczegóły dania" : "Wybierz danie dla tego dnia";

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
    <DayPlanDetailsView dayPlan={existingPlan} onEdit={handleEdit} onDelete={handleDelete} isDeleting={isDeleting} />
  ) : (
    <div className="flex h-full flex-col gap-3">
      <div className="flex-shrink-0 space-y-3">
        <Input
          type="text"
          placeholder="🔍 Szukaj dania po nazwie..."
          value={state.nameSearch}
          onChange={(e) => setNameSearch(e.target.value)}
          className="h-11"
        />

        <TagCreatableCombobox
          value={state.tags}
          onChange={setSelectedTags}
          options={allTags}
          isLoading={isLoadingTags}
          maxTags={3}
        />
      </div>

      <div className="min-h-0 flex-1">
        <DishPickerList
          items={state.dishes}
          isLoading={state.status === "loading"}
          onSelect={selectDish}
          selectedId={state.selectedId}
          emptyVariant={emptyVariant}
        />
      </div>

      {state.error && <div className="flex-shrink-0 text-sm text-destructive">{state.error}</div>}
    </div>
  );

  // Footer: Only show in edit mode
  const footer =
    mode === "edit" ? (
      <>
        <Button variant="outline" onClick={onClose} disabled={state.saving}>
          Anuluj
        </Button>
        <Button onClick={handleSave} disabled={!state.selectedId || state.saving}>
          {state.saving ? "Zapisywanie..." : "Zapisz"}
        </Button>
      </>
    ) : null;

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="!max-h-[96vh] flex h-[96vh] flex-col">
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
      <DialogContent className="flex h-[95vh] max-w-2xl flex-col">
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
