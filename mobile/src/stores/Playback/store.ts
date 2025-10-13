import { isPlaying as rntpIsPlaying } from "@weights-ai/react-native-track-player";
import { useStore } from "zustand";

import { createPersistedSubscribedStore } from "~/lib/zustand";
import type { PlaybackStore } from "./constants";
import { PersistedFields, RepeatModes } from "./constants";

export const playbackStore = createPersistedSubscribedStore<PlaybackStore>(
  (set) => ({
    _hasHydrated: false,
    _init: async () => {
      // Ensure `isPlaying` is correct when we rehydrate the store.
      let upToDateIsPlaying = false;
      try {
        upToDateIsPlaying = (await rntpIsPlaying()).playing ?? false;
      } catch {}
      set({ _hasHydrated: true, isPlaying: upToDateIsPlaying });
    },

    _hasRestoredPosition: false,
    _restoredTrackId: undefined,

    isPlaying: false,
    lastPosition: undefined,

    repeat: RepeatModes.NO_REPEAT,
    shuffle: false,

    playingFrom: undefined,
    playingFromName: "",

    orderSnapshot: [],
    queue: [],

    activeId: undefined,
    activeTrack: undefined,
    queuePosition: 0,
  }),
  {
    name: "music::playback-store",
    // Only store some fields in AsyncStorage.
    partialize: (state) =>
      Object.fromEntries(
        Object.entries(state).filter(([key]) => PersistedFields.includes(key)),
      ),
    // Listen to when the store is hydrated.
    onRehydrateStorage: () => {
      return (state, error) => {
        if (error) console.log("[Music Store]", error);
        else state?._init(state);
      };
    },
    skipHydration: true,
  },
);

export function usePlaybackStore<T>(selector: (s: PlaybackStore) => T): T {
  return useStore(playbackStore, selector);
}
