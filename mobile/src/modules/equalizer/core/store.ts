import AudioBrowser from "react-native-audio-browser";
import { useStore } from "zustand";

import { createPersistedStore } from "~/lib/zustand";
import type { EQPreset, EqualizerStore } from "./constants";
import { OmittedFields } from "./constants";

export const equalizerStore = createPersistedStore<EqualizerStore>(
  (set) => ({
    _hasHydrated: false,
    _init: async (state) => {
      const eqSettings = AudioBrowser.getEqualizerSettings();

      // Set `customBands` if EQ is supported and hasn't been initialized.
      if (eqSettings && state.customBands.length === 0) {
        set({ customBands: eqSettings.bandLevels });
      }

      const defaultPresets = (eqSettings?.presets ?? []) as EQPreset[];
      if (defaultPresets.length > 0) defaultPresets.push("Custom");

      const minBandLevel = eqSettings?.lowerBandLevelLimit ?? 0;
      const maxBandLevel = eqSettings?.upperBandLevelLimit ?? 0;

      set({
        _hasHydrated: true,
        defaultFrequencies: eqSettings?.centerBandFrequencies ?? [],
        defaultPresets,
        minBandLevel,
        maxBandLevel,
        bandOrdinate: Math.max(Math.abs(minBandLevel), maxBandLevel),
      });
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
        Object.entries(state).filter(([key]) => !OmittedFields.includes(key)),
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
