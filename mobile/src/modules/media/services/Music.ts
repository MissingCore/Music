import { toast } from "@backpackapp-io/react-native-toast";
import TrackPlayer, { State } from "react-native-track-player";
import { useStore } from "zustand";

import type { TrackWithAlbum } from "@/db/schema";

import i18next from "@/modules/i18n";
import { getTrack } from "@/api/track";

import { ToastOptions } from "@/lib/toast";
import { createPersistedSubscribedStore } from "@/lib/zustand";
import { shuffleArray } from "@/utils/object";
import {
  formatTrackforPlayer,
  getSourceName,
  getTracksFromIds,
} from "../helpers/data";
import type { PlayListSource } from "../types";

/** Options for repeat status. */
export const RepeatModes = ["no-repeat", "repeat", "repeat-one"] as const;

//#region Store
interface MusicStore {
  /** Determines if the store has been hydrated from AsyncStorage. */
  _hasHydrated: boolean;
  /** Initialize state that weren't initialized from subscriptions. */
  _init: (state: MusicStore) => Promise<void>;
  /** Resets the properties dictating the playing media. */
  reset: () => Promise<void>;

  /** If we're currently playing a track. */
  isPlaying: boolean;

  /** Behavior of how we'll loop in this list of tracks. */
  repeat: (typeof RepeatModes)[number];
  /** Switch to the next repeat mode. */
  cycleRepeat: () => void;
  /**
   * If we should use `shuffledPlayingList` instead of `playingList` for
   * the order of the tracks played.
   */
  shuffle: boolean;
  /** Update the `shuffle` field along with `currentTrackList` & `listIdx`. */
  setShuffle: (status: boolean) => void;

  /** Where the contents of `playingList` is from. */
  playingSource: PlayListSource | undefined;
  /** Name representing the current `PlayListSource`. */
  sourceName: string;
  /** Ordered list of track ids based on the `playingSource`. */
  playingList: string[];
  /** Ordered list of `TrackWithAlbum`. */
  trackList: TrackWithAlbum[];
  /** Shuffled list of track ids based on the `playingSource`. */
  shuffledPlayingList: string[];
  /** Shuffled list of `TrackWithAlbum`. */
  shuffledTrackList: TrackWithAlbum[];
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
}

/** Fields stored in AsyncStorage. */
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
] satisfies Array<keyof MusicStore>;

export const musicStore = createPersistedSubscribedStore<MusicStore>(
  (set, get) => ({
    _hasHydrated: false as boolean,
    _init: async ({ playingSource }) => {
      let sourceName = "";
      if (playingSource) sourceName = await getSourceName(playingSource);
      set({ _hasHydrated: true, sourceName });
    },
    reset: async () => {
      set({
        playingSource: undefined,
        sourceName: "",
        playingList: [],
        shuffledPlayingList: [],
        activeId: undefined,
        listIdx: 0,
        isInQueue: false,
        queueList: [],
      });
      await TrackPlayer.reset();
    },

    isPlaying: false as boolean,

    repeat: "no-repeat",
    cycleRepeat: () => {
      const { repeat } = get();
      let newMode: MusicStore["repeat"] = "repeat";
      if (repeat === "repeat") newMode = "repeat-one";
      else if (repeat === "repeat-one") newMode = "no-repeat";
      set({ repeat: newMode });
    },
    shuffle: false as boolean,
    setShuffle: async (status) => {
      const { currentTrackList, listIdx, trackList, shuffledTrackList } = get();

      const newActiveList = status ? shuffledTrackList : trackList;
      // Shuffle around the track at `listIdx` and not `activeId`.
      const trackAtListIdx = currentTrackList[listIdx]?.id;
      const newListIdx = newActiveList.findIndex(
        ({ id }) => id === trackAtListIdx,
      );

      musicStore.setState({
        currentTrackList: newActiveList,
        listIdx: newListIdx === -1 ? 0 : newListIdx,
      });
      await RNTPManager.reloadNextTrack();
      set({ shuffle: status });
    },

    playingSource: undefined as PlayListSource | undefined,
    sourceName: "",
    playingList: [] as string[],
    trackList: [] as TrackWithAlbum[],
    shuffledPlayingList: [] as string[],
    shuffledTrackList: [] as TrackWithAlbum[],
    currentTrackList: [] as TrackWithAlbum[],

    activeId: undefined as string | undefined,
    activeTrack: undefined as TrackWithAlbum | undefined,
    listIdx: 0,

    isInQueue: false as boolean,
    queueList: [] as string[],
    queuedTrackList: [] as TrackWithAlbum[],
  }),
  {
    name: "music::playing-store",
    // Only store some fields in AsyncStorage.
    partialize: (state) =>
      Object.fromEntries(
        Object.entries(state).filter(([key]) => STORED_FIELDS.includes(key)),
      ),
    // Listen to when the store is hydrated.
    onRehydrateStorage: () => {
      return (state, error) => {
        if (error) console.log("[Music Store]", error);
        else state?._init(state);
      };
    },
  },
);

export const useMusicStore = <T>(selector: (state: MusicStore) => T): T =>
  useStore(musicStore, selector);
//#endregion

//#region Subscriptions
/** Updates all 3 track lists when `playingList` changes. */
musicStore.subscribe(
  (state) => state.playingList,
  async (playingList) => {
    // `shuffledPlayingList` is updated at the same time as `playingList`.
    const { shuffle, shuffledPlayingList } = musicStore.getState();

    const newTrackList = await getTracksFromIds(playingList);
    const newShuffledTrackList = shuffledPlayingList.map(
      (tId) => newTrackList.find(({ id }) => tId === id)!,
    );

    musicStore.setState({
      trackList: newTrackList,
      shuffledTrackList: newShuffledTrackList,
      currentTrackList: shuffle ? newShuffledTrackList : newTrackList,
    });
  },
);

/** Update `activeTrack` when `activeId` changes. */
musicStore.subscribe(
  (state) => state.activeId,
  async (activeId) => {
    // Skip the async request if `activeTrack` is populated with the
    // correct track.
    const currTrack = musicStore.getState().activeTrack;
    if (activeId === currTrack?.id) return;

    let newTrack: TrackWithAlbum | undefined;
    try {
      if (activeId) newTrack = await getTrack(activeId);
    } catch {}
    musicStore.setState({ activeTrack: newTrack });
  },
);

/** Update `queuedTrackList` when `queueList` changes. */
musicStore.subscribe(
  (state) => state.queueList,
  async (queueList) => {
    const newTrackList = await getTracksFromIds(queueList);
    musicStore.setState({ queuedTrackList: newTrackList });
  },
);
//#endregion

//#region Helpers
//#region Queue Helpers
/** Helpers to manipulate the current queue. */
export class Queue {
  /** Add a track id at the end of the current queue. */
  static async add({ id, name }: { id: string; name: string }) {
    musicStore.setState((prev) => ({ queueList: [...prev.queueList, id] }));
    toast(i18next.t("response.queueAdd", { name }), ToastOptions);
    await RNTPManager.reloadNextTrack();
  }

  /** Remove track id at specified index of current queue. */
  static async removeAtIndex(index: number) {
    musicStore.setState((prev) => ({
      queueList: prev.queueList.toSpliced(index, 1),
    }));
    await RNTPManager.reloadNextTrack();
  }

  /** Remove list of track ids in the current queue. */
  static async removeIds(ids: string[]) {
    const idSet = new Set(ids);
    musicStore.setState((prev) => ({
      queueList: prev.queueList.filter((tId) => !idSet.has(tId)),
    }));
    await RNTPManager.reloadNextTrack();
  }
}
//#endregion

//#region RNTP Manager
/**
 * Helps identifies the track played in the `PlaybackActiveTrackChanged`
 * event.
 */
export type TrackStatus = "RELOAD" | "QUEUE" | "END" | undefined;

/** Helpers to help manage the RNTP queue. */
export class RNTPManager {
  /** Determine if any tracks are loaded in RNTP on launch. */
  static async isLoaded() {
    return (await TrackPlayer.getPlaybackState()).state !== State.None;
  }

  /** Initialize the RNTP queue, loading the first 2 tracks. */
  static async preload() {
    if (await RNTPManager.isLoaded()) return;
    console.log("[RNTP] Queue is empty, preloading RNTP Queue...");
    const { activeTrack, isInQueue } = musicStore.getState();
    if (!activeTrack) return;
    // Add the current playing track to the RNTP queue.
    await TrackPlayer.add({
      ...formatTrackforPlayer(activeTrack),
      "music::status": (isInQueue ? "QUEUE" : "RELOAD") satisfies TrackStatus,
    });
    // Add the 2nd track in the RNTP queue.
    await RNTPManager.reloadNextTrack();
  }

  /** Returns the next track or 1st track in queue list. */
  static getNextTrack() {
    const { listIdx, currentTrackList, queuedTrackList } =
      musicStore.getState();

    const nextInQueue = queuedTrackList.length > 0;
    const nextIndex = listIdx === currentTrackList.length - 1 ? 0 : listIdx + 1;
    const nextTrack = nextInQueue
      ? queuedTrackList[0]
      : currentTrackList[nextIndex];

    return {
      activeId: nextTrack?.id,
      activeTrack: nextTrack,
      listIdx: nextInQueue ? -1 : nextIndex,
      isInQueue: nextInQueue,
    };
  }

  /** Returns the track at index before `listIdx` or at `listIdx` if in queue. */
  static getPrevTrack() {
    const { listIdx, currentTrackList, isInQueue } = musicStore.getState();

    let prevIndex = listIdx === 0 ? currentTrackList.length - 1 : listIdx - 1;
    if (isInQueue) prevIndex = listIdx;
    const prevTrack = currentTrackList[prevIndex];

    return {
      activeId: prevTrack?.id,
      activeTrack: prevTrack,
      listIdx: prevTrack ? prevIndex : -1,
      isInQueue: false,
    };
  }

  /** Returns information necessary to switch `playingList` seamlessly. */
  static getUpdatedLists(
    newPlayingList: string[],
    options?: { startTrackId?: string; contextAware?: boolean },
  ) {
    const { shuffle, listIdx, currentTrackList, isInQueue } =
      musicStore.getState();
    const newShuffledPlayingList = shuffleArray(newPlayingList);

    // Get list of tracks we can start from in the new list.
    const prevIdx = listIdx - 1 === 0 ? newPlayingList.length - 1 : listIdx - 1;
    const activeTrackIds = [
      options?.startTrackId,
      currentTrackList[listIdx]?.id,
      // We ensured that the `contextAware` option can never occur when
      // we remove more than 1 track.
      options?.contextAware ? currentTrackList[prevIdx]?.id : undefined,
    ];
    // Get the index we should start at in the new list.
    let newLocation = -1;
    let usedContextAwareness = isInQueue;
    activeTrackIds.forEach((prevTrackId, idx) => {
      if (!prevTrackId || newLocation !== -1) return;
      newLocation = shuffle
        ? newShuffledPlayingList.findIndex((tId) => prevTrackId === tId)
        : newPlayingList.findIndex((tId) => prevTrackId === tId);
      // If `idx = 2`, then the active track should be marked as part of the queue.
      if (idx === 2) usedContextAwareness = true;
    });

    return {
      playingList: newPlayingList,
      shuffledPlayingList: newShuffledPlayingList,
      listIdx: newLocation === -1 ? 0 : newLocation,
      isInQueue: usedContextAwareness || newLocation === -1,
    };
  }

  /** Ensure the next track in the RNTP queue is correct */
  static async reloadNextTrack() {
    // Only update the RNTP queue if its defined.
    if (!(await RNTPManager.isLoaded())) return;
    const currTrack = musicStore.getState().activeTrack;
    // Return early if we're not playing anything.
    if (!currTrack) return;
    const nextTrack = RNTPManager.getNextTrack();
    await TrackPlayer.removeUpcomingTracks();
    // If the next track is `undefined`, then we should run `reset()`
    // after the current track finishes.
    if (!nextTrack.activeId || !nextTrack.activeTrack) {
      await TrackPlayer.add({
        ...formatTrackforPlayer(currTrack),
        // Field read in `PlaybackActiveTrackChanged` event to fire `reset()`.
        "music::status": "END" satisfies TrackStatus,
      });
    } else {
      await TrackPlayer.add({
        ...formatTrackforPlayer(nextTrack.activeTrack),
        "music::status": (nextTrack.isInQueue
          ? "QUEUE"
          : undefined) satisfies TrackStatus,
      });
    }
  }

  /** Revalidates the active track (doesn't update `isInQueue` & `listIdx`). */
  static async reloadCurrentTrack(
    args?: Partial<Record<"restart" | "preload", boolean>>,
  ) {
    if (!(await RNTPManager.isLoaded())) {
      if (args?.preload) await RNTPManager.preload();
      return;
    }
    const playingTrack = await TrackPlayer.getActiveTrack();
    const { activeTrack, isInQueue } = musicStore.getState();
    // Update the current playing track (or restart the track).
    if (playingTrack?.id !== activeTrack?.id || args?.restart) {
      await TrackPlayer.load({
        ...formatTrackforPlayer(activeTrack!),
        "music::status": (isInQueue ? "QUEUE" : "RELOAD") satisfies TrackStatus,
      });
      await TrackPlayer.seekTo(0);
    }
    // Make sure the next track is also "correct".
    await RNTPManager.reloadNextTrack();
  }
}
//#endregion
//#endregion
