import { useCallback } from "react";
import { useStore } from "zustand";

import type { TrackWithAlbum } from "~/db/schema";

import { createPersistedSubscribedStore } from "~/lib/zustand";

/** Options for how we can order tracks. */
export const OrderedByOptions = ["alphabetical", "modified"] as const;

/*
  FIXME: Currently, the store state only supports sorting for the `/tracks`
  screen. In the future, we may want to add sorting support for some of the
  other screens, in which we need to update the store implementation.
*/

//#region Store
interface SortPreferencesStore {
  /** Determines if the store has been hydrated from AsyncStorage. */
  _hasHydrated: boolean;
  /** Initialize state that weren't initialized from subscriptions. */
  _init: (state: SortPreferencesStore) => void;

  /** Should tracks be displayed in ascending order. */
  isAsc: boolean;
  toggleIsAsc: () => void;
  /** The attribute which tracks will be ordered by. */
  orderedBy: (typeof OrderedByOptions)[number];
  setOrderedBy: (sortType: SortPreferencesStore["orderedBy"]) => void;
}

export const sortPreferencesStore =
  createPersistedSubscribedStore<SortPreferencesStore>(
    (set) => ({
      _hasHydrated: false as boolean,
      _init: () => {
        set({ _hasHydrated: true });
      },

      isAsc: true,
      toggleIsAsc: () => set((prev) => ({ isAsc: !prev.isAsc })),
      orderedBy: "alphabetical",
      setOrderedBy: (sortType) => set({ orderedBy: sortType }),
    }),
    {
      name: "music::sort-preferences-store",
      // Only store some fields in AsyncStorage.
      partialize: (state) => ({
        isAsc: state.isAsc,
        orderedBy: state.orderedBy,
      }),
      // Listen to when the store is hydrated.
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) console.log("[Sort Preferences Store]", error);
          else state?._init(state);
        };
      },
    },
  );

export const useSortPreferencesStore = <T>(
  selector: (state: SortPreferencesStore) => T,
): T => useStore(sortPreferencesStore, selector);
//#endregion

//#region Helpers
/** Sort tracks based on filters for `/track` screen. */
export function sortTracks(
  tracks: TrackWithAlbum[],
  /** If we want this to be reactive (ie: In a hook). */
  config?: { isAsc: boolean; orderedBy: (typeof OrderedByOptions)[number] },
) {
  const isAsc = config?.isAsc ?? sortPreferencesStore.getState().isAsc;
  const orderedBy =
    config?.orderedBy ?? sortPreferencesStore.getState().orderedBy;

  // FIXME: Once Hermes supports `toSorted` & `toReversed`, use those
  // instead of the in-place methods.
  let sortedTracks: TrackWithAlbum[] = [...tracks];
  // Order track by attribute.
  if (orderedBy === "alphabetical") {
    sortedTracks.sort((a, b) => a.name.localeCompare(b.name));
  } else if (orderedBy === "modified") {
    sortedTracks.sort((a, b) => a.modificationTime - b.modificationTime);
  }
  // Sort tracks in descending order.
  if (!isAsc) sortedTracks.reverse();

  return sortedTracks;
}

/** Hook variant of `sortTracks`. */
export function useSortTracks() {
  const isAsc = useSortPreferencesStore((state) => state.isAsc);
  const orderedBy = useSortPreferencesStore((state) => state.orderedBy);

  return useCallback(
    (data: TrackWithAlbum[]) => sortTracks(data, { isAsc, orderedBy }),
    [isAsc, orderedBy],
  );
}
//#endregion
