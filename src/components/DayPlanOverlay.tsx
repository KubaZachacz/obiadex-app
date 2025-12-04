import { useEffect, useState } from "react";
import { useDishPicker } from "@/components/hooks/useDishPicker";
import { TagFilterCombobox } from "./TagFilterCombobox";
import { DishPickerList } from "./DishPickerList";
import { Button } from "@/components/ui/button";
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
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { X } from "lucide-react";
import { isToday, parseDateISO } from "@/lib/date/utils";

interface DayPlanOverlayProps {
  day: string | null;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Routable overlay for selecting/changing a dish for a day.
 * Renders as Dialog on desktop, Drawer on mobile.
 */
export function DayPlanOverlay({
  day,
  onClose,
  onSaved,
}: DayPlanOverlayProps) {
  const [isMobile, setIsMobile] = useState(false);
  const isOpen = day !== null;

  const {
    state,
    allTags,
    isLoadingTags,
    selectDish,
    setSelectedTags,
    saveDayPlan,
    refetchDishes,
  } = useDishPicker(day || "");

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
  const description = "Wybierz danie dla tego dnia";

  const emptyVariant =
    state.tags.length === 0 && state.dishes.length === 0
      ? "no-data"
      : "no-results";

  // Content shared between Dialog and Drawer
  const content = (
    <div className="space-y-4">
      <TagFilterCombobox
        value={state.tags}
        onChange={setSelectedTags}
        allTags={allTags}
        isLoading={isLoadingTags}
      />

      <DishPickerList
        items={state.dishes}
        isLoading={state.status === "loading"}
        onSelect={selectDish}
        selectedId={state.selectedId}
        emptyVariant={emptyVariant}
      />

      {state.error && (
        <div className="text-sm text-destructive">{state.error}</div>
      )}
    </div>
  );

  const footer = (
    <>
      <Button
        variant="outline"
        onClick={onClose}
        disabled={state.saving}
      >
        Anuluj
      </Button>
      <Button
        onClick={handleSave}
        disabled={!state.selectedId || state.saving}
      >
        {state.saving ? "Zapisywanie..." : "Zapisz"}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4">{content}</div>

          <DrawerFooter className="flex-row gap-2">
            {footer}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {content}

        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
