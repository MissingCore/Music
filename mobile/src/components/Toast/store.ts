import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import type { Toast } from "./types";

interface ToastStore {
  toasts: Toast[];
}

export const toastStore = createStore<ToastStore>()(() => ({
  toasts: [],
}));

export const useToastStore = <T>(selector: (state: ToastStore) => T): T =>
  useStore(toastStore, selector);
