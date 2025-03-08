import { toast } from "@backpackapp-io/react-native-toast";
import TrackPlayer, { State } from "react-native-track-player";
import { useStore } from "zustand";

import type { TrackWithAlbum } from "~/db/schema";

import i18next from "~/modules/i18n";
import {
  deleteTrack,
  getTrack,
  removeInvalidTrackRelations,
} from "~/api/track";

import { clearAllQueries } from "~/lib/react-query";
import { ToastOptions } from "~/lib/toast";
import { createPersistedSubscribedStore } from "~/lib/zustand";
import { shuffleArray } from "~/utils/object";
import { formatTrackforPlayer, getSourceName } from "../helpers/data";
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
  /** Logic we run if we catch when the app crashes. */
  resetOnCrash: () => Promise<void>;

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
  /** Update the `shuffle` field along with `currentList` & `listIdx`. */
  setShuffle: (status: boolean) => void;

  /** Where the contents of `playingList` is from. */
  playingSource: PlayListSource | undefined;
  /** Name representing the current `PlayListSource`. */
  sourceName: string;
  /** Ordered list of track ids based on the `playingSource`. */
  playingList: string[];
  /** Shuffled list of track ids based on the `playingSource`. */
  shuffledPlayingList: string[];
  /** The list of track ids used based on `shuffle`. */
  currentList: string[];

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
    _hasHydrated: false,
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
    resetOnCrash: async () => {
      try {
        await get().reset();
        await removeInvalidTrackRelations();
      } catch {}
    },

    isPlaying: false,

    repeat: "no-repeat",
    cycleRepeat: () => {
      const { repeat } = get();
      let newMode: MusicStore["repeat"] = "repeat";
      if (repeat === "repeat") newMode = "repeat-one";
      else if (repeat === "repeat-one") newMode = "no-repeat";
      set({ repeat: newMode });
    },
    shuffle: false,
    setShuffle: async (status) => {
      const { currentList, listIdx, playingList, shuffledPlayingList } = get();

      const newPlayingList = status ? shuffledPlayingList : playingList;
      // Shuffle around the track at `listIdx` and not `activeId`.
      const trackAtListIdx = currentList[listIdx];
      const newListIdx = newPlayingList.findIndex(
        (id) => id === trackAtListIdx,
      );

      musicStore.setState({
        currentList: newPlayingList,
        listIdx: newListIdx === -1 ? 0 : newListIdx,
      });
      await RNTPManager.reloadNextTrack();
      set({ shuffle: status });
    },

    playingSource: undefined,
    sourceName: "",
    playingList: [],
    shuffledPlayingList: [],
    currentList: [],

    activeId: undefined,
    activeTrack: undefined,
    listIdx: 0,

    isInQueue: false,
    queueList: [],
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
    skipHydration: true,
  },
);

export const useMusicStore = <T>(selector: (state: MusicStore) => T): T =>
  useStore(musicStore, selector);
//#endregion

//#region Subscriptions
/**
 * Ensure the next track naturally played is correct when we change the
 * repeat mode.
 */
musicStore.subscribe(
  (state) => state.repeat,
  async () => {
    await RNTPManager.reloadNextTrack();
  },
);

/** Keep `currentList` up-to-date when the lists changes. */
musicStore.subscribe(
  (state) => state.playingList,
  (playingList) => {
    // `shuffledPlayingList` is updated at the same time as `playingList`.
    const { shuffle, shuffledPlayingList } = musicStore.getState();
    musicStore.setState({
      currentList: shuffle ? shuffledPlayingList : playingList,
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

    try {
      const newTrack = activeId ? await getTrack(activeId) : undefined;
      musicStore.setState({ activeTrack: newTrack });
    } catch {
      // Handle when track doesn't exist.
      console.log(
        `[Database Mismatch] Track (${activeId}) doesn't exist in the database.`,
      );
      // Can't add to `InvalidTrack` schema as track doesn't exist in database.
      await deleteTrack(activeId!);
      clearAllQueries();
      await musicStore.getState().reset();
      return;
    }
  },
);
//#endregion

//#region Helpers
//#region Queue Helpers
/** Helpers to manipulate the current queue. */
export class Queue {
  /** Add a track id at the end of the current queue. */
  static async add({ id, name }: { id: string; name: string }) {
    const prevQueueLength = musicStore.getState().queueList.length;
    musicStore.setState((prev) => ({ queueList: [...prev.queueList, id] }));
    toast(i18next.t("feat.modalTrack.extra.queueAdd", { name }), ToastOptions);
    if (prevQueueLength === 0) await RNTPManager.reloadNextTrack();
  }

  /** Remove track id at specified index of current queue. */
  static async removeAtIndex(index: number) {
    musicStore.setState((prev) => ({
      queueList: prev.queueList.toSpliced(index, 1),
    }));
    if (index === 0) await RNTPManager.reloadNextTrack();
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
export type TrackStatus = "RELOAD" | "REPEAT" | "QUEUE" | "END" | undefined;

/** Helpers to help manage the RNTP queue. */
export class RNTPManager {
  /** Determine if any tracks are loaded in RNTP on launch. */
  static async isLoaded() {
    try {
      return (await TrackPlayer.getPlaybackState()).state !== State.None;
    } catch {
      return false;
    }
  }

  /** Initialize the RNTP queue, loading the first 2 tracks. */
  static async preload() {
    if (await RNTPManager.isLoaded()) return;
    console.log("[RNTP] Queue is empty, preloading RNTP Queue...");
    const { activeTrack, isInQueue, repeat } = musicStore.getState();
    if (!activeTrack) return;
    // Identify how we'll load the track.
    const trackStatus: TrackStatus =
      repeat === "repeat-one" ? "REPEAT" : isInQueue ? "QUEUE" : "RELOAD";
    // Add the current playing track to the RNTP queue.
    await TrackPlayer.add({
      ...formatTrackforPlayer(activeTrack),
      "music::status": trackStatus,
    });
    // Add the 2nd track in the RNTP queue.
    await RNTPManager.reloadNextTrack();
  }

  /** Returns the next track or 1st track in queue list. */
  static async getNextTrack() {
    const { listIdx, currentList, queueList } = musicStore.getState();

    const nextInQueue = queueList.length > 0;
    const nextIndex = listIdx === currentList.length - 1 ? 0 : listIdx + 1;

    const nextTrackId = nextInQueue ? queueList[0] : currentList[nextIndex];
    let nextTrack: TrackWithAlbum | undefined = undefined;
    try {
      if (nextTrackId) nextTrack = await getTrack(nextTrackId);
    } catch {}

    return {
      activeId: nextTrackId,
      activeTrack: nextTrack,
      listIdx: nextInQueue ? -1 : nextIndex,
      isInQueue: nextInQueue,
    };
  }

  /** Returns the track at index before `listIdx` or at `listIdx` if in queue. */
  static async getPrevTrack() {
    const { listIdx, currentList, isInQueue } = musicStore.getState();

    let prevIndex = listIdx === 0 ? currentList.length - 1 : listIdx - 1;
    if (isInQueue) prevIndex = listIdx;

    const prevTrackId = currentList[prevIndex];
    let prevTrack: TrackWithAlbum | undefined = undefined;
    try {
      if (prevTrackId) prevTrack = await getTrack(prevTrackId);
    } catch {}

    return {
      activeId: prevTrackId,
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
    const { shuffle, listIdx, currentList, isInQueue } = musicStore.getState();
    const newShuffledPlayingList = shuffleArray(newPlayingList);

    // Get list of tracks we can start from in the new list.
    const prevIdx = listIdx - 1 === 0 ? newPlayingList.length - 1 : listIdx - 1;
    const activeTrackIds = [
      options?.startTrackId,
      currentList[listIdx],
      // We ensured that the `contextAware` option can never occur when
      // we remove more than 1 track.
      options?.contextAware ? currentList[prevIdx] : undefined,
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
    const { activeTrack: currTrack, repeat } = musicStore.getState();
    // Return early if we're not playing anything.
    if (!currTrack) return;
    const nextTrack = await RNTPManager.getNextTrack();
    await TrackPlayer.removeUpcomingTracks();
    // If the next track is `undefined`, then we should run `reset()`
    // after the current track finishes. If we're in "repeat-one" mode,
    // then we'll repeat the current track.
    if (repeat === "repeat-one" || !nextTrack.activeTrack) {
      const status: TrackStatus = repeat === "repeat-one" ? "REPEAT" : "END";
      await TrackPlayer.add({
        ...formatTrackforPlayer(currTrack),
        "music::status": status,
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
    const { activeTrack, isInQueue, repeat } = musicStore.getState();
    if (!activeTrack) return;
    // Update the current playing track (or restart the track).
    if (playingTrack?.id !== activeTrack.id || args?.restart) {
      // Identify how we'll load the track.
      const trackStatus: TrackStatus =
        repeat === "repeat-one" ? "REPEAT" : isInQueue ? "QUEUE" : "RELOAD";
      await TrackPlayer.load({
        ...formatTrackforPlayer(activeTrack),
        "music::status": trackStatus,
      });
      await TrackPlayer.seekTo(0);
    }
    // Make sure the next track is also "correct".
    await RNTPManager.reloadNextTrack();
  }
}
//#endregion
//#endregion
