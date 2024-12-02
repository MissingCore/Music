import { toast } from "@backpackapp-io/react-native-toast";
import TrackPlayer, { State } from "react-native-track-player";
import { useStore } from "zustand";

import type { TrackWithAlbum } from "@/db/schema";

import i18next from "@/modules/i18n";
import { getTrack } from "@/api/track";
import { RecentList } from "./RecentList";

import { ToastOptions } from "@/lib/toast";
import { createPersistedSubscribedStore } from "@/lib/zustand";
import { shuffleArray } from "@/utils/object";
import {
  arePlaybackSourceEqual,
  formatTrackforPlayer,
  getSourceName,
  getTrackList,
  getTracksFromIds,
} from "../helpers/data";
import type { PlayListSource } from "../types";

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

  /**
   * If we should continue playing from the beginning of the queue after
   * finishing the last track.
   */
  repeat: boolean;
  /** Update the `repeat` field. */
  setRepeat: (status: boolean) => void;
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

    repeat: false as boolean,
    setRepeat: (status) => set({ repeat: status }),
    shuffle: false as boolean,
    setShuffle: async (status) => {
      const { currentTrackList, listIdx, trackList, shuffledTrackList } = get();

      const newActiveList = status ? shuffledTrackList : trackList;
      // Shuffle around the track at `listIdx` and not `activeId`.
      const trackAtListIdx = currentTrackList[listIdx]!.id;
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
      console.log("[Music Store] Re-hydrating storage.");
      return (state, error) => {
        if (error) console.log("[Music Store]", error);
        else {
          console.log("[Music Store] Completed with:", state);
          state?._init(state);
        }
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
  static getUpdatedLists(newPlayingList: string[], startTrackId?: string) {
    const { shuffle, listIdx, currentTrackList } = musicStore.getState();
    const newShuffledPlayingList = shuffleArray(newPlayingList);

    // Get the index we should start at in the new list.
    const prevTrackId = startTrackId ?? currentTrackList[listIdx]!.id;
    const newLocation = shuffle
      ? newShuffledPlayingList.findIndex((tId) => prevTrackId === tId)
      : newPlayingList.findIndex((tId) => prevTrackId === tId);
    const newListIdx = newLocation === -1 ? 0 : newLocation;

    return {
      playingList: newPlayingList,
      shuffledPlayingList: newShuffledPlayingList,
      listIdx: newListIdx,
      isInQueue: newLocation === -1,
    };
  }

  /** Ensure the next track in the RNTP queue is correct */
  static async reloadNextTrack() {
    // Only update the RNTP queue if its defined.
    if (!(await RNTPManager.isLoaded())) return;
    const currTrack = musicStore.getState().activeTrack;
    const nextTrack = RNTPManager.getNextTrack();
    await TrackPlayer.removeUpcomingTracks();
    // Return if we have no tracks (ie: when we removed a track from
    // the current list).
    if (!nextTrack.activeTrack || !currTrack) return;
    // If the next track is `undefined`, then we should run `reset()`
    // after the current track finishes.
    if (nextTrack.activeId === undefined) {
      await TrackPlayer.add({
        ...formatTrackforPlayer(currTrack!),
        // Field read in `PlaybackActiveTrackChanged` event to fire `reset()`.
        "music::status": "END" satisfies TrackStatus,
      });
    } else {
      await TrackPlayer.add({
        ...formatTrackforPlayer(nextTrack.activeTrack!),
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

//#region Resynchronization Helpers
/**
 * Helpers to ensure the Jotai store is up-to-date with the changes made
 * in React Query.
 */
export class Resynchronize {
  /** Resynchronize when we delete one or more media lists. */
  static async onDelete(removedRefs: PlayListSource | PlayListSource[]) {
    if (Array.isArray(removedRefs)) RecentList.removeEntries(removedRefs);
    else RecentList.removeEntries([removedRefs]);

    // Check if we were playing this list.
    const currSource = musicStore.getState().playingSource;
    if (!currSource) return;

    const isPlayingRef = Array.isArray(removedRefs)
      ? RecentList.isInRecentList(currSource, removedRefs)
      : arePlaybackSourceEqual(currSource, removedRefs);
    if (isPlayingRef) await musicStore.getState().reset();
  }

  /** Resynchronize when we update the artwork. */
  static onImage() {
    RecentList.refresh();
  }

  /** Resynchronize when we rename a playlist. */
  static onRename({
    oldSource,
    newSource,
  }: Record<"oldSource" | "newSource", PlayListSource>) {
    RecentList.replaceEntry({ oldSource, newSource });

    // Check if we were playing this list.
    const currSource = musicStore.getState().playingSource;
    if (!currSource) return;

    const isPlayingRef = arePlaybackSourceEqual(currSource, oldSource);
    if (isPlayingRef) {
      getSourceName(newSource).then((newName) =>
        musicStore.setState({ playingSource: newSource, sourceName: newName }),
      );
    }
  }

  /** Resynchronize when we update the tracks in a media list. */
  static async onTracks(ref: PlayListSource) {
    RecentList.refresh();

    // Check if we were playing this list.
    const { playingSource, activeId } = musicStore.getState();
    if (!playingSource) return;
    const isPlayingRef = arePlaybackSourceEqual(playingSource, ref);
    if (!isPlayingRef) return;

    // Make sure our track lists along with the current index are up-to-date.
    const newPlayingList = (await getTrackList(playingSource)).map(
      ({ id }) => id,
    );
    const newListsInfo = RNTPManager.getUpdatedLists(newPlayingList, activeId);

    // Update state.
    musicStore.setState({ ...newListsInfo });

    // Make sure the next track is correct after updating the list used.
    await RNTPManager.reloadNextTrack();
  }

  /** Resynchronize if we discovered new tracks in the current playing list. */
  static async onUpdatedList(newIds: string[]) {
    if (newIds.length === 0) return;
    const currSource = musicStore.getState().playingSource;
    if (currSource === undefined) return;

    const hasUnstagedTrack = (await getTrackList(currSource)).some(
      ({ id: tId }) => newIds.includes(tId),
    );
    if (hasUnstagedTrack) await Resynchronize.onTracks(currSource);
  }
}
//#endregion
//#endregion
