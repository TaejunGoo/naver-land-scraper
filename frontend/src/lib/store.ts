import { create } from "zustand";
import { ReactNode } from "react";

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

interface HeaderState {
  title: string | ReactNode;
  actions?: ReactNode;
  showBackButton?: boolean;
  setHeader: (config: { title: string | ReactNode; actions?: ReactNode; showBackButton?: boolean }) => void;
  resetHeader: () => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
  title: "랜드브리핑",
  actions: null,
  showBackButton: false,
  setHeader: (config) => set(config),
  resetHeader: () => set({ title: "랜드브리핑", actions: null, showBackButton: false }),
}));
