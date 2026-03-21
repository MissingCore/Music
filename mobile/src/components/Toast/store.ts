import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import type { Toast } from "./types";

interface ToastStore {
  toasts: Toast[];
  removeToast: (toastId: string) => void;
}

export const toastStore = createStore<ToastStore>()((set) => ({
  toasts: [],
  removeToast: (toastId) => {
    set((prev) => ({ toasts: prev.toasts.filter((t) => t.id !== toastId) }));
  },
}));

export const useToastStore = <T>(selector: (state: ToastStore) => T): T =>
  useStore(toastStore, selector);
