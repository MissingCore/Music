import { useStore } from "zustand";

import { createPersistedStore } from "~/lib/zustand";
import type { EqualizerStore } from "./constants";
import { PersistedFields } from "./constants";

export const equalizerStore = createPersistedStore<EqualizerStore>(
  (set) => ({
    _hasHydrated: false,
    _init: async () => {
      set({ _hasHydrated: true });
    },

    enabled: false,
    preset: "Normal",
    customBands: [],

    defaultFrequencies: [],
    defaultPresets: [],
    minBandLevel: 0,
    maxBandLevel: 0,
    bandOrdinate: 0,
  }),
  {
    name: "music::equalizer",
    // Only store some fields in AsyncStorage.
    partialize: (state) =>
      Object.fromEntries(
        Object.entries(state).filter(([key]) => PersistedFields.includes(key)),
      ),
    // Listen to when the store is hydrated.
    onRehydrateStorage: () => {
      return (state, error) => {
        if (error) console.log("[Equalizer Store]", error);
        else state?._init(state);
      };
    },
  },
);

export function useEqualizerStore<T>(selector: (s: EqualizerStore) => T): T {
  return useStore(equalizerStore, selector);
}
