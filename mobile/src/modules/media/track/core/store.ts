import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

interface TrackMutliSelectStore {
  enabled: boolean;
  /** List of track ids. */
  selected: Set<string>;
  /** Whether the user has added all the selected tracks to the "Favorites" playlist. */
  isAllFavorited: boolean;
}

export const trackMultiSelectStore = createStore<TrackMutliSelectStore>()(
  () => ({
    enabled: false,
    selected: new Set<string>(),
    isAllFavorited: false,
  }),
);

export function useTrackMultiSelectStore<T>(
  selector: (state: TrackMutliSelectStore) => T,
): T {
  return useStore(trackMultiSelectStore, selector);
}
