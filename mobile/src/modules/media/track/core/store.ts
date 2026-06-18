import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

interface TrackMutliSelectStore {
  enabled: boolean;
  selected: Set<string>;
}

export const trackMultiSelectStore = createStore<TrackMutliSelectStore>()(
  () => ({
    enabled: false,
    selected: new Set<string>(),
  }),
);

export function useTrackMultiSelectStore<T>(
  selector: (state: TrackMutliSelectStore) => T,
): T {
  return useStore(trackMultiSelectStore, selector);
}
