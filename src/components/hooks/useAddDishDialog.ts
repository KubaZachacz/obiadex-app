import { create } from "zustand";

interface AddDishDialogState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/**
 * Global state for the add dish dialog.
 * This allows the FAB and dialog to be controlled from anywhere in the app.
 */
export const useAddDishDialog = create<AddDishDialogState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
