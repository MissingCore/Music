import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import type { Toast } from "./types";

interface ToastStore {
  toasts: Toast[];
  /** Pops the first toast. */
  shiftToast: VoidFunction;
}

export const toastStore = createStore<ToastStore>()((set) => ({
  toasts: [],
  shiftToast: () => {
    set((prev) => ({ toasts: prev.toasts.slice(1) }));
  },
}));

export const useToastStore = <T>(selector: (state: ToastStore) => T): T =>
  useStore(toastStore, selector);
