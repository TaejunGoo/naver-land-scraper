import { create } from "zustand";

interface AlertState {
  open: boolean;
  title: string;
  description: string;
  onConfirm?: () => void;
  showAlert: (title: string, description: string, onConfirm?: () => void) => void;
  closeAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  open: false,
  title: "",
  description: "",
  onConfirm: undefined,
  showAlert: (title, description, onConfirm) =>
    set({ open: true, title, description, onConfirm }),
  closeAlert: () => set({ open: false }),
}));
