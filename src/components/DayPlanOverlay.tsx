import { useEffect, useState } from "react";
import { useDishPicker } from "@/components/hooks/useDishPicker";
import { TagCreatableCombobox } from "./TagCreatableCombobox";
import { DishPickerList } from "./DishPickerList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

/**
 * Routable overlay for selecting/changing a dish for a day.
 * Renders as Dialog on desktop, Drawer on mobile.
 */
export function DayPlanOverlay({ day, onClose, onSaved }: DayPlanOverlayProps) {
  const [isMobile, setIsMobile] = useState(false);
  const isOpen = day !== null;

  const { state, allTags, isLoadingTags, selectDish, setSelectedTags, setNameSearch, saveDayPlan } = useDishPicker(
    day || ""
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

  const emptyVariant = state.tags.length === 0 && state.dishes.length === 0 ? "no-data" : "no-results";

  // Content shared between Dialog and Drawer
  const content = (
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

  const footer = (
    <>
      <Button variant="outline" onClick={onClose} disabled={state.saving}>
        Anuluj
      </Button>
      <Button onClick={handleSave} disabled={!state.selectedId || state.saving}>
        {state.saving ? "Zapisywanie..." : "Zapisz"}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="!max-h-[96vh] flex h-[96vh] flex-col">
          <DrawerHeader className="flex-shrink-0 pb-3">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 flex-1 px-4 pb-4">{content}</div>

          <DrawerFooter className="flex-shrink-0 flex-row gap-2">{footer}</DrawerFooter>
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

        <DialogFooter className="flex-shrink-0">{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
