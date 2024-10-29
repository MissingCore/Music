/**
 * Store representing user preferences for this given session (ie: will
 * reset back to "defaults" after closing then reopening the app).
 */

import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

/** Options for how we can order tracks. */
export const OrderedByOptions = ["alphabetical", "modified"] as const;

interface SessionPreferencesStore {
  // Preferences for sorting tracks visually in `/track` screen.
  /** Should tracks be displayed in ascending order. */
  isAsc: boolean;
  toggleIsAsc: () => void;
  /** The attribute which tracks will be ordered by. */
  orderedBy: (typeof OrderedByOptions)[number];
  setOrderedBy: (sortType: SessionPreferencesStore["orderedBy"]) => void;
}

export const sessionPreferencesStore = createStore<SessionPreferencesStore>()(
  (set) => ({
    isAsc: true,
    toggleIsAsc: () => set((prev) => ({ isAsc: !prev.isAsc })),
    orderedBy: "alphabetical",
    setOrderedBy: (sortType) => set({ orderedBy: sortType }),
  }),
);

export const useSessionPreferencesStore = <T>(
  selector: (state: SessionPreferencesStore) => T,
): T => useStore(sessionPreferencesStore, selector);
