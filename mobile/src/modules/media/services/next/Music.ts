import AsyncStorage from "@react-native-async-storage/async-storage";
import { persist, createJSONStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import type { TrackWithAlbum } from "@/db/schema";

import type { MediaCard } from "@/components/media/card";
import type { PlayListSource } from "../../types";

//#region Store Definition
interface MusicStore {
  /** Determines if the store has been hydrated from AsyncStorage. */
  _hasHydrated: boolean;
  setHasHydrated: (newState: boolean) => void;

  /** If we're currently playing a track. */
  isPlaying: boolean;

  /**
   * If we should continue playing from the beginning of the queue after
   * finishing the last track.
   */
  repeat: boolean;
  /**
   * If we should use `shuffledPlayingList` instead of `playingList` for
   * the order of the tracks played.
   */
  shuffle: boolean;

  /** Where the contents of `playingList` is from. */
  playingSource: PlayListSource | undefined;
  /** Ordered list of track ids based on the `playingSource`. */
  playingList: string[];
  /** Ordered list of `TrackWithAlbum`. */
  trackList: TrackWithAlbum[];
  /** Shuffled list of track ids based on the `playingSource`. */
  shuffledPlayingList: string[];
  /** Shuffled list of `TrackWithAlbum`. */
  shuffledTrackList: TrackWithAlbum[];
  /** The list of track ids used based on `shuffle`. */
  currentList: string[];
  /** The list of `TrackWithAlbum` used based on `shuffle`. */
  currentTrackList: TrackWithAlbum[];

  /**
   * The id of the track currently being played (which might not be the
   * one at `listIdx`).
   */
  activeId: string | undefined;
  /** Information about the current playing track. */
  activeTrack: TrackWithAlbum | undefined;
  /**
   * The index of the track that is currently being played (or the last
   * track played if we're playing from the queue).
   */
  listIdx: number;

  /** If the current playing track is in the queue. */
  isInQueue: boolean;
  /** List of track ids that we want to play next. */
  queueList: string[];
  /** List of `TrackWithAlbum` from `queueList`. */
  queuedTrackList: TrackWithAlbum[];

  /** List of `playingSource` the user has played. */
  recentListSources: PlayListSource[];
  /** List of `MediaCard.Content` we've recently played. */
  recentList: MediaCard.Content[];
}

const STORED_FIELDS: string[] = [
  "repeat",
  "shuffle",
  "playingSource",
  "playingList",
  "shuffledPlayingList",
  "activeId",
  "listIdx",
  "isInQueue",
  "queueList",
  "recentListSources",
] satisfies Array<keyof MusicStore>;

export const musicStore = createStore<MusicStore>()(
  persist(
    (set) => ({
      _hasHydrated: false as boolean,
      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

      isPlaying: false as boolean,

      repeat: false as boolean,
      shuffle: false as boolean,

      playingSource: undefined as PlayListSource | undefined,
      playingList: [] as string[],
      trackList: [] as TrackWithAlbum[],
      shuffledPlayingList: [] as string[],
      shuffledTrackList: [] as TrackWithAlbum[],
      currentList: [] as string[],
      currentTrackList: [] as TrackWithAlbum[],

      activeId: undefined as string | undefined,
      activeTrack: undefined as TrackWithAlbum | undefined,
      listIdx: 0,

      isInQueue: false as boolean,
      queueList: [] as string[],
      queuedTrackList: [] as TrackWithAlbum[],

      recentListSources: [] as PlayListSource[],
      recentList: [] as MediaCard.Content[],
    }),
    {
      name: "music::playing-store",
      storage: createJSONStorage(() => AsyncStorage),
      // Only store some fields in AsyncStorage.
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => STORED_FIELDS.includes(key)),
        ),
      // Listen to when the store is hydrated.
      onRehydrateStorage: () => {
        console.log("[Zustand Hydration] Re-hydrating storage.");
        return (state, error) => {
          if (error) console.log("[Zustand Hydration]", error);
          else {
            console.log("[Zustand Hydration] Completed with:", state);
            state?.setHasHydrated(true);
          }
        };
      },
    },
  ),
);
//#endregion
