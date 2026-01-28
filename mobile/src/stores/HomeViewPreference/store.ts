import { useStore } from "zustand";

import { createPersistedSubscribedStore } from "~/lib/zustand";
import type { HomeViewPreferenceStore } from "./constants";
import { OmittedFields } from "./constants";

export const homeViewPreferenceStore =
  createPersistedSubscribedStore<HomeViewPreferenceStore>(
    (set) => ({
      _hasHydrated: false,
      _init: async () => {
        set({ _hasHydrated: true });
      },

      artistLayout: "list",
    }),
    {
      name: "music::home-view-preferences",
      // Only store some fields in AsyncStorage.
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !OmittedFields.includes(key)),
        ),
      // Listen to when the store is hydrated.
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) console.log("[Home View Preference Store]", error);
          else state?._init(state);
        };
      },
    },
  );

export function useHomeViewPreferenceStore<T>(
  selector: (s: HomeViewPreferenceStore) => T,
): T {
  return useStore(homeViewPreferenceStore, selector);
}
