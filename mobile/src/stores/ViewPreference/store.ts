import { useStore } from "zustand";

import { createPersistedStore } from "~/lib/zustand";
import type { ViewPreferenceStore } from "./constants";
import { OmittedFields } from "./constants";

export const viewPreferenceStore = createPersistedStore<ViewPreferenceStore>(
  (set) => ({
    _hasHydrated: false,
    _init: async () => {
      set({ _hasHydrated: true });
    },

    albumLayout: "grid",
    albumIsAsc: true,
    albumOrder: "name",

    artistLayout: "list",
    artistIsAsc: true,
    artistOrder: "name",

    artistTracksIsAsc: true,
    artistTracksOrder: "name",

    folderIsAsc: true,
    folderOrder: "name",

    genreLayout: "list",
    genreIsAsc: true,
    genreOrder: "name",

    genreTracksIsAsc: true,
    genreTracksOrder: "name",

    playlistLayout: "grid",
    playlistIsAsc: true,
    playlistOrder: "name",

    trackIsAsc: true,
    trackOrder: "name",
  }),
  {
    name: "music::view-preferences",
    // Only store some fields in AsyncStorage.
    partialize: (state) =>
      Object.fromEntries(
        Object.entries(state).filter(([key]) => !OmittedFields.includes(key)),
      ),
    // Listen to when the store is hydrated.
    onRehydrateStorage: () => {
      return (state, error) => {
        if (error) console.log("[View Preference Store]", error);
        else state?._init(state);
      };
    },
  },
);

export function useViewPreferenceStore<T>(
  selector: (s: ViewPreferenceStore) => T,
): T {
  return useStore(viewPreferenceStore, selector);
}
