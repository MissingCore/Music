import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

interface TrackMultiSelectStore {
  enabled: boolean;
  /** List of track ids. */
  selected: Set<string>;
  /** Whether the user has added all the selected tracks to the "Favorites" playlist. */
  isAllFavorited: boolean;
}

export const trackMultiSelectStore = createStore<TrackMultiSelectStore>()(
  () => ({
    enabled: false,
    selected: new Set<string>(),
    isAllFavorited: false,
  }),
);

export function useTrackMultiSelectStore<T>(
  selector: (state: TrackMultiSelectStore) => T,
): T {
  return useStore(trackMultiSelectStore, selector);
}

export const TrackMultiSelect = {
  enable() {
    trackMultiSelectStore.setState({ enabled: true, isAllFavorited: false });
  },
  reset() {
    trackMultiSelectStore.setState({
      enabled: false,
      isAllFavorited: false,
      selected: new Set(),
    });
  },
  toggleSelection(id: string) {
    trackMultiSelectStore.setState((prev) => {
      const updatedSet = new Set(prev.selected);
      let updatedIsAllFavorited = prev.isAllFavorited;
      if (updatedSet.has(id)) updatedSet.delete(id);
      else {
        updatedSet.add(id);
        updatedIsAllFavorited = false;
      }
      return {
        enabled: updatedSet.size > 0,
        selected: updatedSet,
        isAllFavorited: updatedIsAllFavorited,
      };
    });
  },
};
