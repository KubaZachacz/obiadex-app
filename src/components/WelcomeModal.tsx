"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { cn } from "@/lib/utils";

const LOCAL_STORAGE_KEY = "obiadex-welcome-shown";

const slides = [
  {
    title: "Zbuduj swoją bazę smaków",
    description: "Dodawaj ulubione obiady w kilku krokach, tak szybko jak zapis w notatniku.",
    detail: "Podaj nazwę, dobierz tagi i wracaj do gotowania — reszta zostaje na później.",
    points: ["Lekki formularz bez zbędnych pól", "Tagi pomagają odnaleźć pomysły", "Zapis trwa mniej niż minutę"],
  },
  {
    title: "Znajdujesz w sekundę",
    description: "Wpisujesz kilka liter, wybierasz tagi i widzisz tylko to, co pasuje.",
    detail: "Przejrzysta lista prowadzi od razu do konkretu, nawet przy setkach dań.",
    points: ["Szybkie wyszukiwanie", "Filtry działają intuicyjnie", "Przejrzyste karty dań"],
  },
  {
    title: "Plan na dziś i jutro",
    description: "Klikasz dzień, wskazujesz danie i od razu wiesz, co gotować.",
    detail: "Zmienisz zdanie? Wróć, podmień wybór i plan jest aktualny w sekundę.",
    points: ["Wybor jednym kliknięciem", "Podpowiedzi rzadziej używanych dań", "Plan zawsze pod ręką"],
  },
] as const;

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasSeenModal = window.localStorage.getItem(LOCAL_STORAGE_KEY);

    if (!hasSeenModal) {
      setIsOpen(true);
    }
  }, []);

  const slide = slides[pageIndex];

  const markSeen = () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LOCAL_STORAGE_KEY, "true");
  };

  const closeModal = () => {
    markSeen();
    setIsOpen(false);
  };

  const goToNext = () => {
    if (pageIndex < slides.length - 1) {
      setPageIndex((prev) => prev + 1);
      return;
    }

    closeModal();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeModal();
      return;
    }

    setIsOpen(true);
  };

  const dots = useMemo(
    () =>
      slides.map((_, index) => (
        <span
          key={index}
          aria-hidden
          className={cn("h-2 w-2 rounded-full transition-all", index === pageIndex ? "bg-primary" : "bg-gray-200")}
        />
      )),
    [pageIndex]
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent data-testid="welcome-modal" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{slide.title}</DialogTitle>
          <DialogDescription>{slide.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p>{slide.detail}</p>
          <ul className="flex flex-col gap-1">
            {slide.points.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex justify-center gap-2">{dots}</div>

        <DialogFooter className="mt-6 flex justify-between gap-2">
          <Button data-testid="welcome-modal-close" variant="ghost" onClick={closeModal}>
            Close
          </Button>
          <Button data-testid="welcome-modal-next" onClick={goToNext}>
            {pageIndex === slides.length - 1 ? "Finish" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
