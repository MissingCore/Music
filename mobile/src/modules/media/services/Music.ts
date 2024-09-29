/**
 * Store representing the Media Player Interface.
 *
 * This file contains classes containing helpers to manipulate the store.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { eq } from "drizzle-orm";
import { Toast } from "react-native-toast-notifications";
import TrackPlayer, { State } from "react-native-track-player";
import { useStore } from "zustand";
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import type { PlaylistWithTracks, TrackWithAlbum } from "@/db/schema";
import { albums, artists, playlists, tracks } from "@/db/schema";
import {
  getAlbum,
  getArtist,
  getPlaylist,
  getSpecialPlaylist,
  getTrack,
} from "@/db/queries";
import { formatForMediaCard } from "@/db/utils/formatters";

import { shuffleArray } from "@/utils/object";
import type { MediaCard } from "@/components/media/card";
import { ReservedPlaylists } from "../constants/ReservedNames";
import {
  arePlaybackSourceEqual,
  formatTrackforPlayer,
  getTrackList,
  getTracksFromIds,
} from "../helpers/data";
import type { PlayListSource } from "../types";

//#region Zustand Store
//#region MusicStore Interface
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
  /** Update the `repeat` field. */
  setRepeat: (status: boolean) => void;
  /**
   * If we should use `shuffledPlayingList` instead of `playingList` for
   * the order of the tracks played.
   */
  shuffle: boolean;
  /** Update the `shuffle` field. */
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
//#endregion

//#region Fields stored in AsyncStorage
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
//#endregion

//#region Store Creation
export const musicStore = createStore<MusicStore>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        _hasHydrated: false as boolean,
        setHasHydrated: (state) => {
          set({ _hasHydrated: state });
        },

        isPlaying: false as boolean,

        repeat: false as boolean,
        setRepeat: (status: boolean) => set({ repeat: status }),
        shuffle: false as boolean,
        setShuffle: (status: boolean) => set({ shuffle: status }),

        playingSource: undefined as PlayListSource | undefined,
        sourceName: "",
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
            Object.entries(state).filter(([key]) =>
              STORED_FIELDS.includes(key),
            ),
          ),
        // Listen to when the store is hydrated.
        onRehydrateStorage: () => {
          console.log("[Music Store] Re-hydrating storage.");
          return (state, error) => {
            if (error) console.log("[Music Store]", error);
            else {
              console.log("[Music Store] Completed with:", state);
              state?.setHasHydrated(true);
            }
          };
        },
      },
    ),
  ),
);

//#region Custom Hook
export const useMusicStore = <T>(selector: (state: MusicStore) => T): T =>
  useStore(musicStore, selector);
//#endregion
//#endregion

//#region Subscriptions
/** Update `currentList` & `currentTrackList` when `shuffle` changes. */
musicStore.subscribe(
  (state) => state.shuffle,
  async (shuffle) => {
    const {
      _hasHydrated,
      activeId,
      currentList,
      listIdx,
      playingList,
      trackList,
      shuffledPlayingList,
      shuffledTrackList,
    } = musicStore.getState();

    const newCurrList = shuffle ? shuffledPlayingList : playingList;
    // During hydration, `currentList = []` as we don't save that value into
    // AsyncStorage. In that case, it'll be the value in `newCurrList`.
    const prevCurrList = !_hasHydrated ? newCurrList : currentList;
    // Get the new `listIdx` value.
    const trackAtListIdx = prevCurrList[listIdx]!;
    const isActiveInList = prevCurrList.some((tId) => tId === activeId);

    // New list index will be based either on the current playing track if
    // it's in the list, or the track at the `listIdx` index.
    const newListIdx =
      activeId === undefined
        ? 0
        : isActiveInList
          ? newCurrList.findIndex((tId) => tId === activeId)
          : newCurrList.findIndex((tId) => tId === trackAtListIdx);

    musicStore.setState({
      currentList: newCurrList,
      currentTrackList: shuffle ? shuffledTrackList : trackList,
      listIdx: newListIdx,
    });

    await RNTPManager.reloadNextTrack();
  },
);

/** Update `sourceName` when `playingSource` changes. */
musicStore.subscribe(
  (state) => state.playingSource,
  async (source) => {
    if (!source) {
      musicStore.setState({ sourceName: "" });
      return;
    }

    let newSourceName = "";
    try {
      if (
        (Object.values(ReservedPlaylists) as string[]).includes(source.id) ||
        ["artist", "playlist"].includes(source.type)
      ) {
        newSourceName = source.id;
      } else if (source.type === "folder") {
        // FIXME: At `-2` index due to the folder path (in `id`) ending with
        // a trailing slash.
        newSourceName = source.id.split("/").at(-2) ?? "";
      } else if (source.type === "album") {
        const album = await getAlbum([eq(albums.id, source.id)]);
        newSourceName = album.name;
      }
    } catch {}

    musicStore.setState({ sourceName: newSourceName });
  },
);

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
      if (activeId) newTrack = await getTrack([eq(tracks.id, activeId)]);
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

/** Update `recentList` when `recentListSources` changes. */
musicStore.subscribe(
  (state) => state.recentListSources,
  async (recentListSources) => {
    const newRecentList: MediaCard.Content[] = [];
    const errors: PlayListSource[] = [];

    for (const { id, type } of recentListSources) {
      try {
        if (type === "album") {
          const data = await getAlbum([eq(albums.id, id)]);
          newRecentList.push(formatForMediaCard({ type: "album", data }));
        } else if (type === "artist") {
          const data = await getArtist([eq(artists.name, id)]);
          newRecentList.push(formatForMediaCard({ type: "artist", data }));
        } else if (type === "playlist") {
          let data: PlaylistWithTracks;
          if (
            id === ReservedPlaylists.favorites ||
            id === ReservedPlaylists.tracks
          ) {
            data = await getSpecialPlaylist(id);
          } else {
            data = await getPlaylist([eq(playlists.name, id)]);
          }
          newRecentList.push(formatForMediaCard({ type: "playlist", data }));
        } else if (type === "folder") {
          // TODO: Eventually support folders in the recent list.
        } else {
          throw new Error("Unsupported recent list type.");
        }
      } catch {
        errors.push({ id, type });
      }
    }

    musicStore.setState({
      // Remove any `PlayListSource` in `recentListSources` that are invalid.
      ...(errors.length > 0
        ? recentListSources.filter(
            (s1) => !errors.some((s2) => arePlaybackSourceEqual(s1, s2)),
          )
        : {}),
      recentList: newRecentList,
    });
  },
);
//#endregion
//#endregion

//#region Helpers
//#region Queue Helpers
/** Helpers to manipulate the current queue. */
export class Queue {
  /** Add a track id at the end of the current queue. */
  static async add(trackId: string) {
    musicStore.setState((prev) => ({
      queueList: [...prev.queueList, trackId],
    }));
    Toast.show("Added track to queue.");

    await RNTPManager.reloadNextTrack();
  }

  /** Remove track id at specified index of current queue. */
  static async removeAtIndex(index: number) {
    musicStore.setState((prev) => ({
      queueList: prev.queueList.filter((_, idx) => idx !== index),
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

//#region Recent List Helpers
/** Helpers to manipulate the recent list. */
export class RecentList {
  /** Factory function to compare 2 `PlayListSource` inside array methods easier. */
  static #compare(fixedSource: PlayListSource, negate = false) {
    return (source: PlayListSource) =>
      negate
        ? !arePlaybackSourceEqual(fixedSource, source)
        : arePlaybackSourceEqual(fixedSource, source);
  }

  /** Remove a `PlayListSource` inside a `PlayListSource[]`. */
  static #removeSourceInList(
    removedSource: PlayListSource,
    sourceList: PlayListSource[],
  ) {
    return sourceList.filter(RecentList.#compare(removedSource, true));
  }

  /** Add the latest media list played into the recent list. */
  static add(newSource: PlayListSource) {
    let prevList = musicStore.getState().recentListSources;
    if (RecentList.isInRecentList(newSource, prevList)) {
      prevList = RecentList.#removeSourceInList(newSource, prevList);
    }
    musicStore.setState({ recentListSources: [newSource, ...prevList] });
  }

  /** Determines if a `PlayListSource` already exists in a `PlayListSource[]`. */
  static isInRecentList(source: PlayListSource, sourceList: PlayListSource[]) {
    return sourceList.some(RecentList.#compare(source));
  }

  /** Replace a specific entry in the recent list. */
  static replaceEntry({
    oldSource,
    newSource,
  }: Record<"oldSource" | "newSource", PlayListSource>) {
    const prevList = musicStore.getState().recentListSources;
    const entryIdx = prevList.findIndex(RecentList.#compare(oldSource));
    if (entryIdx === -1) return;
    musicStore.setState({
      recentListSources: prevList.with(entryIdx, newSource),
    });
  }

  /** Remove a multiple entries from the recent list. */
  static removeEntry(removedSource: PlayListSource) {
    musicStore.setState((prev) => ({
      recentListSources: RecentList.#removeSourceInList(
        removedSource,
        prev.recentListSources,
      ),
    }));
  }

  /** Remove multiple entries in the recent list. */
  static removeEntries(removedSources: PlayListSource[]) {
    let prevList = musicStore.getState().recentListSources;
    removedSources.forEach((removedSource) => {
      prevList = RecentList.#removeSourceInList(removedSource, prevList);
    });
    musicStore.setState({ recentListSources: prevList });
  }

  /**
   * Force a revalidation of the values returned in `recentListAtom`. Useful
   * when some information displayed (ie: playlist cover/name) changes or
   * gets deleted.
   */
  static refresh() {
    musicStore.setState((prev) => ({
      recentListSources: [...prev.recentListSources],
    }));
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
  static async isRNTPLoaded() {
    return (await TrackPlayer.getPlaybackState()).state !== State.None;
  }

  /** Initialize the RNTP queue, loading the first 2 tracks. */
  static async preloadRNTPQueue() {
    if (await RNTPManager.isRNTPLoaded()) return;
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

  /**
   * Returns the next track to be played.
   *
   * This is the 1st track in `queueList` or the track at the index after
   * `listIdx`.
   */
  static getNextTrack() {
    const { listIdx, currentTrackList, queuedTrackList } =
      musicStore.getState();

    const nextInQueue = queuedTrackList.length > 0;
    const nextIndex = listIdx === currentTrackList.length - 1 ? 0 : listIdx + 1;
    const nextTrack = nextInQueue
      ? queuedTrackList[0]
      : currentTrackList[nextIndex];

    return {
      trackId: nextTrack?.id,
      track: nextTrack,
      newIdx: nextInQueue ? -1 : nextIndex,
      isInQueue: nextInQueue,
    };
  }

  /**
   * Returns the previous track to be played.
   *
   * This is the track at `listIdx` if we were playing from the queue or
   * the track at the index before `listIdx`.
   */
  static getPrevTrack() {
    const { listIdx, currentTrackList, isInQueue } = musicStore.getState();

    const prevIndex = isInQueue
      ? listIdx
      : listIdx === 0
        ? currentTrackList.length - 1
        : listIdx - 1;
    const prevTrack = currentTrackList[prevIndex];

    return {
      trackId: prevTrack?.id,
      track: prevTrack,
      newIdx: prevTrack ? prevIndex : -1,
      isInQueue: false,
    };
  }

  /** Updates all the playing lists, along with `listIdx`. */
  static getPlayingLists(newPlayingList: string[], startTrackId?: string) {
    const { shuffle, listIdx, currentList } = musicStore.getState();
    const newShuffledPlayingList = shuffleArray(newPlayingList);

    // Get the new index of the track at `listIdx` if the list changes.
    const prevTrackId = startTrackId ?? currentList[listIdx]!;
    const newLocation = shuffle
      ? newShuffledPlayingList.findIndex((tId) => prevTrackId === tId)
      : newPlayingList.findIndex((tId) => prevTrackId === tId);
    const newListIdx = newLocation === -1 ? 0 : newLocation;

    return {
      playingList: newPlayingList,
      shuffledPlayingList: newShuffledPlayingList,
      currentList: shuffle ? newShuffledPlayingList : newPlayingList,

      listIdx: newListIdx,
      isInQueue: newLocation === -1,
    };
  }

  /** Make sure the next track in the RNTP queue is correct */
  static async reloadNextTrack() {
    // Only update the RNTP queue if its defined.
    if (!(await RNTPManager.isRNTPLoaded())) return;
    const currTrack = musicStore.getState().activeTrack;

    const { trackId, track, isInQueue } = RNTPManager.getNextTrack();
    await TrackPlayer.removeUpcomingTracks();

    // Return if we have no tracks (ie: when we removed a track from
    // the current list).
    if (!track || !currTrack) return;

    // If the next track is `undefined`, then we should run `resetState()`
    // after the current track finishes.
    if (trackId === undefined) {
      await TrackPlayer.add({
        ...formatTrackforPlayer(currTrack!),
        /**
         * Custom field that we'll read in the `PlaybackActiveTrackChanged`
         * event to fire `resetState()`.
         */
        "music::status": "END" satisfies TrackStatus,
      });
    } else {
      await TrackPlayer.add({
        ...formatTrackforPlayer(track!),
        "music::status": (isInQueue
          ? "QUEUE"
          : undefined) satisfies TrackStatus,
      });
    }
  }

  /**
   * Checks to see if we should be playing the current track.
   *
   * This checks the track identified by `activeId`. It's our responsibilty
   * to update `isInQueue`, `listIdx`, and `activeId` correctly.
   */
  static async reloadCurrentTrack(args?: {
    restart?: boolean;
    preload?: boolean;
  }) {
    if (!(await RNTPManager.isRNTPLoaded())) {
      if (args?.preload) await RNTPManager.preloadRNTPQueue();
      return;
    }
    const playingTrack = await TrackPlayer.getActiveTrack();
    const { activeTrack, isInQueue } = musicStore.getState();

    // If we are playing the right track, don't do anything (unless
    // we want to restart).
    if (playingTrack?.id === activeTrack?.id && !args?.restart) return;

    await TrackPlayer.load({
      ...formatTrackforPlayer(activeTrack!),
      "music::status": (isInQueue ? "QUEUE" : "RELOAD") satisfies TrackStatus,
    });
    await TrackPlayer.seekTo(0);
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
    else RecentList.removeEntry(removedRefs);

    // Check if we were playing this list.
    const currSource = musicStore.getState().playingSource;
    if (!currSource) return;

    const isPlayingRef = Array.isArray(removedRefs)
      ? RecentList.isInRecentList(currSource, removedRefs)
      : arePlaybackSourceEqual(currSource, removedRefs);
    if (isPlayingRef) await resetState();
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
    if (isPlayingRef) musicStore.setState({ playingSource: newSource });
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
    const newListsInfo = RNTPManager.getPlayingLists(newPlayingList, activeId);

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

//#region Reset Function
/** Resets the persistent state when something goes wrong. */
export async function resetState() {
  musicStore.setState({
    playingSource: undefined,
    playingList: [],
    shuffledPlayingList: [],
    activeId: undefined,
    listIdx: 0,
    isInQueue: false,
    queueList: [],
  });
  await TrackPlayer.reset();
}
//#endregion
