import TrackPlayer, {
  isPlaying as rntpIsPlaying,
} from "@weights-ai/react-native-track-player";
import { inArray } from "drizzle-orm";
import { useStore } from "zustand";

import { db } from "~/db";
import { tracksToPlaylists } from "~/db/schema";
import { getTrack } from "~/api/track";

import { createPersistedSubscribedStore } from "~/lib/zustand";
import { resetWidgets } from "~/modules/widget/utils/update";
import type { PlaybackStore } from "./constants";
import { PersistedFields, RepeatModes } from "./constants";
import { extractTrackId } from "./utils";

export const playbackStore = createPersistedSubscribedStore<PlaybackStore>(
  (set, get) => ({
    _hasHydrated: false,
    _init: async ({ activeKey }) => {
      // Ensure we populate the `activeTrack` from `activeKey`.
      let activeTrack: PlaybackStore["activeTrack"];
      if (activeKey) {
        activeTrack = await get().getTrack(activeKey);
        // The track should exist if `activeKey` is defined.
        if (!activeTrack) return;
      }
      // Ensure `isPlaying` is correct when we rehydrate the store.
      let upToDateIsPlaying = false;
      try {
        upToDateIsPlaying = (await rntpIsPlaying()).playing ?? false;
      } catch {}
      set({ _hasHydrated: true, isPlaying: upToDateIsPlaying, activeTrack });
    },

    getTrack: async (trackKey) => {
      const tId = extractTrackId(trackKey);
      try {
        const wantedTrack = await getTrack(tId);
        return wantedTrack;
      } catch {
        console.log(
          `[Database Mismatch] Track (${tId}) doesn't exist in the database.`,
        );
        // Reset the store since `activeTrack` doesn't exist.
        await get().reset();
      }
    },
    reset: async () => {
      set({
        _hasHydrated: true,
        _hasRestoredPosition: false,
        _restoredTrackId: undefined,
        isPlaying: false,
        lastPosition: 0,
        playingFrom: undefined,
        playingFromName: "",
        orderSnapshot: [],
        queue: [],
        activeKey: undefined,
        activeTrack: undefined,
        queuePosition: 0,
      });
      await TrackPlayer.reset();
      await resetWidgets();
    },
    resetOnCrash: async () => {
      try {
        await get().reset();

        // Delete any `TracksToPlaylists` entries where the `trackId` doesn't exist.
        const [allTracks, trackRels] = await Promise.all([
          db.query.tracks.findMany({ columns: { id: true } }),
          db
            .selectDistinct({ id: tracksToPlaylists.trackId })
            .from(tracksToPlaylists),
        ]);
        const trackIds = new Set(allTracks.map((t) => t.id));
        const relTrackIds = trackRels.map((t) => t.id);
        // Get ids in the track to playlist relationship where the track id
        // doesn't exist and delete them.
        const invalidTracks = relTrackIds.filter((id) => !trackIds.has(id));
        if (invalidTracks.length > 0) {
          await db
            .delete(tracksToPlaylists)
            .where(inArray(tracksToPlaylists.trackId, invalidTracks));
        }
      } catch {}
    },

    _hasRestoredPosition: false,
    _restoredTrackId: undefined,

    isPlaying: false,
    lastPosition: 0,

    repeat: RepeatModes.NO_REPEAT,
    shuffle: false,

    playingFrom: undefined,
    playingFromName: "",

    orderSnapshot: [],
    queue: [],

    activeKey: undefined,
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
        if (error) console.log("[Playback Store]", error);
        else state?._init(state);
      };
    },
    skipHydration: true,
  },
);

export function usePlaybackStore<T>(selector: (s: PlaybackStore) => T): T {
  return useStore(playbackStore, selector);
}
