import { useStore } from "zustand";

import { createPersistedStore } from "~/lib/zustand";
import type { LyricStore } from "./constants";
import { PersistedFields } from "./constants";

export const lyricStore = createPersistedStore<LyricStore>(
  (set) => ({
    _hasHydrated: false,
    _init: async () => {
      set({ _hasHydrated: true });
    },

    visible: false,
    checkEmbedded: true,
    providers: [],
  }),
  {
    name: "music::lyric",
    // Only store some fields in AsyncStorage.
    partialize: (state) =>
      Object.fromEntries(
        Object.entries(state).filter(([key]) => PersistedFields.includes(key)),
      ),
    // Listen to when the store is hydrated.
    onRehydrateStorage: () => {
      return (state, error) => {
        if (error) console.log("[Lyric Store]", error);
        else state?._init(state);
      };
    },
  },
);

export function useLyricStore<T>(selector: (s: LyricStore) => T): T {
  return useStore(lyricStore, selector);
}
