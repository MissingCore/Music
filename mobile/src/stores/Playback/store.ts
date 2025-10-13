import { isPlaying as rntpIsPlaying } from "@weights-ai/react-native-track-player";
import { useStore } from "zustand";

import { db } from "~/db";

import { createPersistedSubscribedStore } from "~/lib/zustand";
import type { PlaybackStore } from "./constants";
import { PersistedFields, RepeatModes } from "./constants";

export const playbackStore = createPersistedSubscribedStore<PlaybackStore>(
  (set, _, store) => ({
    _hasHydrated: false,
    _init: async ({ activeId }) => {
      // Ensure we populate the `activeTrack` from `activeId`.
      let activeTrack: PlaybackStore["activeTrack"];
      if (activeId) {
        activeTrack = await db.query.tracks.findFirst({
          where: (fields, { eq }) => eq(fields.id, activeId),
          with: { album: true },
        });
        if (activeTrack) {
          activeTrack.artwork =
            activeTrack.artwork ?? activeTrack.album?.artwork ?? null;
        } else {
          console.log(
            `[Database Mismatch] Track (${activeId}) doesn't exist in the database.`,
          );
          // Reset the store since `activeTrack` doesn't exist.
          set({ ...store.getInitialState(), _hasHydrated: true });
          return;
        }
      }

      // Ensure `isPlaying` is correct when we rehydrate the store.
      let upToDateIsPlaying = false;
      try {
        upToDateIsPlaying = (await rntpIsPlaying()).playing ?? false;
      } catch {}
      set({ _hasHydrated: true, isPlaying: upToDateIsPlaying, activeTrack });
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
