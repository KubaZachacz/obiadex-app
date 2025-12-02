import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DishForm } from "@/components/DishForm";

interface DishEditorOverlayProps {
  mode: "create" | "edit";
  dishId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DishEditorOverlay({ mode, dishId, isOpen, onClose }: DishEditorOverlayProps) {
  const [open, setOpen] = useState(isOpen);

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && typeof onClose === "function") {
      onClose();
    }
  };

  const handleSuccess = () => {
    // Close the dialog and navigate back
    setOpen(false);
    window.location.href = "/dishes";
  };

  const handleCancel = () => {
    setOpen(false);
    if (typeof onClose === "function") {
      onClose();
    } else {
      // Fallback: navigate back if onClose is not provided
      window.location.href = "/dishes";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Dodaj nowe danie" : "Edytuj danie"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Wypełnij formularz, aby dodać nowe danie do swojej bazy."
              : "Zaktualizuj informacje o daniu."}
          </DialogDescription>
        </DialogHeader>
        <DishForm mode={mode} dishId={dishId} onSuccess={handleSuccess} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  );
}
