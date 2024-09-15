/**
 * Atoms representing the Media Player Interface.
 *
 * This file contains both synchronous & asynchronous atoms for accessing
 * values representing the player's state.
 */

import { eq } from "drizzle-orm";
import { atom } from "jotai";
import { RESET, unwrap } from "jotai/utils";
import { Toast } from "react-native-toast-notifications";
import TrackPlayer from "react-native-track-player";

import type { PlaylistWithTracks } from "@/db/schema";
import { albums, artists, playlists, tracks } from "@/db/schema";
import {
  getAlbum,
  getArtist,
  getPlaylist,
  getSpecialPlaylist,
  getTrack,
} from "@/db/queries";
import { formatForMediaCard } from "@/db/utils/formatters";

import { createAtomWithStorage, getAtom, setAtom } from "@/lib/jotai";
import { shuffleArray } from "@/utils/object";
import type { MediaCard } from "@/components/media/card";
import { ReservedPlaylists } from "../constants/ReservedNames";
import {
  arePlaybackSourceEqual,
  getTrackList,
  getTracksFromIds,
} from "../helpers/data";
import type { PlayListSource } from "../types";

//#region Synchronous State
const isPlayingAtom = atom(false);
//#endregion

//#region Repeat
const repeatAsyncAtom = createAtomWithStorage("repeat", false);
const repeatAtom = unwrap(repeatAsyncAtom, (prev) => prev ?? false);
//#endregion

//#region Shuffle
const shuffleAsyncAtom = createAtomWithStorage("shuffle", false);
const shuffleUnwrapAtom = unwrap(shuffleAsyncAtom, (prev) => prev ?? false);
const shuffleAtom = atom(
  (get) => get(shuffleUnwrapAtom),
  async (get, set) => {
    const prevShuffled = await get(shuffleAsyncAtom);
    const currPlayingIdx = await get(currPlayingIdxAsyncAtom);
    const playingList = await get(playingListAsyncAtom);
    const shuffledPlayingList = await get(shuffledPlayingListAsyncAtom);

    // Update `currPlayingIdxAsyncAtom` to reflect the new index of the track
    // in the used playing list.
    //  - We need to keep in mind that `currPlayingIdAsyncAtom` might be
    //  part of `queueListAsyncAtom`.
    let newPlayingIdx: number | undefined;
    if (prevShuffled) {
      const currTrackId = shuffledPlayingList[currPlayingIdx];
      newPlayingIdx = playingList.findIndex((id) => id === currTrackId);
    } else {
      const currTrackId = playingList[currPlayingIdx];
      newPlayingIdx = shuffledPlayingList.findIndex((id) => id === currTrackId);
    }
    set(currPlayingIdxAsyncAtom, newPlayingIdx);

    set(shuffleAsyncAtom, !prevShuffled);

    // FIXME: Need to add logic to update the next playing track in the RNTP queue.
  },
);
//#endregion

//#region Playing List
const playingSourceAsyncAtom = createAtomWithStorage<
  PlayListSource | undefined
>("playing-source", undefined);
const playingSourceAtom = unwrap(
  playingSourceAsyncAtom,
  (prev) => prev ?? undefined,
);

const playingListAsyncAtom = createAtomWithStorage<string[]>(
  "playing-list",
  [],
);
const trackListAsyncAtom = atom(async (get) => {
  return getTracksFromIds(await get(playingListAsyncAtom));
});
const trackListAtom = unwrap(trackListAsyncAtom, (prev) => prev ?? []);

const shuffledPlayingListAsyncAtom = createAtomWithStorage<string[]>(
  "shuffled-playing-list",
  [],
);
const shuffledTrackListAsyncAtom = atom(async (get) => {
  return getTracksFromIds(await get(shuffledPlayingListAsyncAtom));
});
const shuffledTrackListAtom = unwrap(
  shuffledTrackListAsyncAtom,
  (prev) => prev ?? [],
);

const currPlayingIdxAsyncAtom = createAtomWithStorage("curr-playing-idx", -1);

const currPlayingIdAsyncAtom = createAtomWithStorage<string | undefined>(
  "curr-playing-id",
  undefined,
);
const activeTrackAsyncAtom = atom(async (get) => {
  const trackId = await get(currPlayingIdAsyncAtom);
  if (!trackId) return undefined;
  try {
    return getTrack([eq(tracks.id, trackId)]);
  } catch {
    return undefined; // Error thrown as track doesn't exist.
  }
});
const activeTrackAtom = unwrap(
  activeTrackAsyncAtom,
  (prev) => prev ?? undefined,
);
//#endregion

//#region Queue
const isInQueueAsyncAtom = createAtomWithStorage("is-in-queue", false);
const isInQueueAtom = unwrap(isInQueueAsyncAtom, (prev) => prev ?? false);

const queueListAsyncAtom = createAtomWithStorage<string[]>("queue-list", []);
const queuedTrackListAsyncAtom = atom(async (get) => {
  return getTracksFromIds(await get(queueListAsyncAtom));
});
const queuedTrackListAtom = unwrap(
  queuedTrackListAsyncAtom,
  (prev) => prev ?? [],
);
//#endregion

//#region Recent List
const recentListSourcesAsyncAtom = createAtomWithStorage<PlayListSource[]>(
  "recent-list",
  [],
);
const recentListAsyncAtom = atom(async (get) => {
  const recentSources = await get(recentListSourcesAsyncAtom);
  const recentObjs: MediaCard.Content[] = [];

  for (const { id, type } of recentSources) {
    try {
      if (type === "album") {
        const data = await getAlbum([eq(albums.id, id)]);
        recentObjs.push(formatForMediaCard({ type: "album", data }));
      } else if (type === "artist") {
        const data = await getArtist([eq(artists.name, id)]);
        recentObjs.push(formatForMediaCard({ type: "artist", data }));
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
        recentObjs.push(formatForMediaCard({ type: "playlist", data }));
      } else if (type === "folder") {
        // TODO: Eventually support folders in the recent list.
      } else {
        throw new Error("Unsupported recent list type.");
      }
    } catch {
      // List doesn't exist or isn't supported.
      await RecentList.removeEntry({ type, id });
    }
  }

  return recentObjs;
});
const recentListAtom = unwrap(recentListAsyncAtom, (prev) => prev ?? []);
//#endregion

//#region Exported Atoms
export const AsyncAtomState = {
  /** If playback should continue after reaching the end. */
  repeat: repeatAsyncAtom,
  /** If we should use the shuffled play list. */
  shuffle: shuffleAsyncAtom,

  /** Where we get the list of tracks we're playing. */
  playingSource: playingSourceAsyncAtom,
  /** List of track ids that we want to play. */
  playingList: playingListAsyncAtom,
  /** List of `TrackWithAlbum` that we want to play. */
  trackList: trackListAsyncAtom,
  /** List of shuffled track ids that we want to play. */
  shuffledPlayingList: shuffledPlayingListAsyncAtom,
  /** List of shuffled `TrackWithAlbum` that we want to play. */
  shuffledTrackList: shuffledTrackListAsyncAtom,
  /** Index of the track we're currently playing (or last left off). */
  currPlayingIdx: currPlayingIdxAsyncAtom,
  /** Id of the track we're currently playing. */
  currPlayingId: currPlayingIdAsyncAtom,
  /** Information about the current playing track. */
  activeTrack: activeTrackAsyncAtom,

  /** Determine if `currentPlayingId` belongs in the queue. */
  isInQueue: isInQueueAsyncAtom,
  /** List of track ids that we want to play before the ones in the playing list. */
  queueList: queueListAsyncAtom,
  /**
   * List of `TrackWithAlbum` that we want to play before the ones in
   * the playing list.
   */
  queuedTrackList: queuedTrackListAsyncAtom,

  /** List of `PlayListSource` we've recently played. */
  recentListSources: recentListSourcesAsyncAtom,
  /** List of `MediaCard.Content` we've recently played. */
  recentList: recentListAsyncAtom,
};

export const SyncAtomState = {
  /** Synchronously determine if a track is playing. */
  isPlaying: isPlayingAtom,

  /** If playback should continue after reaching the end. */
  repeat: repeatAtom,
  /** If we should use the shuffled play list. */
  shuffle: shuffleAtom,

  /** Where we get the list of tracks we're playing. */
  playingSource: playingSourceAtom,
  /** Information about the current playing track. */
  activeTrack: activeTrackAtom,
  /** List of `TrackWithAlbum` that we want to play. */
  trackList: trackListAtom,
  /** List of shuffled `TrackWithAlbum` that we want to play. */
  shuffledTrackList: shuffledTrackListAtom,

  /** Determine if `currentPlayingId` belongs in the queue. */
  isInQueue: isInQueueAtom,
  /**
   * List of `TrackWithAlbum` that we want to play before the ones in
   * the playing list.
   */
  queuedTrackList: queuedTrackListAtom,

  /** List of `MediaCard.Content` we've recently played. */
  recentList: recentListAtom,
};
//#endregion

//#region Queue Helpers
/** Helpers to manipulate the current queue. */
export class Queue {
  /** Add track id at the end of the current queue. */
  static async add(trackId: string) {
    // Make sure track exists.
    try {
      await getTrack([eq(tracks.id, trackId)]);
    } catch {
      Toast.show("Track no longer exists.", { type: "danger" });
      return;
    }

    await setAtom(queueListAsyncAtom, async (prev) => {
      return [...(await prev), trackId];
    });
    Toast.show("Added track to queue.");

    // FIXME: Need to add logic to update the next playing track in the RNTP queue.
  }

  /** Remove track id at specified index of current queue. */
  static async removeAtIndex(index: number) {
    await setAtom(queueListAsyncAtom, async (prev) =>
      (await prev).filter((_, idx) => idx !== index),
    );

    // FIXME: Need to add logic to update the next playing track in the RNTP queue.
  }

  /** Remove list of track ids in the current queue. */
  static async removeIds(ids: string[]) {
    const idSet = new Set(ids);
    await setAtom(queueListAsyncAtom, async (prev) =>
      (await prev).filter((tId) => !idSet.has(tId)),
    );

    // FIXME: Need to add logic to update the next playing track in the RNTP queue.
  }
}
//#endregion

//#region Recent List Helpers
/** Helpers to manipulate the recent list. */
export class RecentList {
  /** Factory function to compare 2 `PlayListSource` inside array methods easier. */
  static #compare(fixedRef: PlayListSource, negate = false) {
    return (ref: PlayListSource) =>
      negate
        ? !arePlaybackSourceEqual(fixedRef, ref)
        : arePlaybackSourceEqual(fixedRef, ref);
  }

  /** Remove a `PlayListSource` inside a `PlayListSource[]`. */
  static #removeRefInList(ref: PlayListSource, refList: PlayListSource[]) {
    return refList.filter(RecentList.#compare(ref, true));
  }

  /** Add the latest media list played into the recent list. */
  static async add(newRef: PlayListSource) {
    await setAtom(recentListSourcesAsyncAtom, async (_prevList) => {
      let prevList = await _prevList;
      if (RecentList.isInRecentList(newRef, prevList)) {
        prevList = RecentList.#removeRefInList(newRef, prevList);
      }
      return [newRef, ...prevList];
    });
  }

  /** Determines if a `PlayListSource` already exists in a `PlayListSource[]`. */
  static isInRecentList(ref: PlayListSource, refList: PlayListSource[]) {
    return refList.some(RecentList.#compare(ref));
  }

  /** Replace a specific entry in the recent list. */
  static async replaceEntry({
    oldEntry,
    newEntry,
  }: Record<"oldEntry" | "newEntry", PlayListSource>) {
    const prevList = await getAtom(recentListSourcesAsyncAtom);
    const entryIdx = prevList.findIndex(RecentList.#compare(oldEntry));
    if (entryIdx === -1) return;

    await setAtom(recentListSourcesAsyncAtom, [
      ...prevList.slice(0, entryIdx),
      newEntry,
      ...prevList.slice(entryIdx + 1),
    ]);
  }

  /** Remove a specific entry from the recent list. */
  static async removeEntry(removedRef: PlayListSource) {
    await setAtom(recentListSourcesAsyncAtom, async (prevList) =>
      RecentList.#removeRefInList(removedRef, await prevList),
    );
  }

  /** Remove multiple entries in the recent list. */
  static async removeEntries(removedRefs: PlayListSource[]) {
    await setAtom(recentListSourcesAsyncAtom, async (_prevList) => {
      let prevList = await _prevList;
      removedRefs.forEach((removedRef) => {
        prevList = RecentList.#removeRefInList(removedRef, prevList);
      });
      return prevList;
    });
  }

  /**
   * Force a revalidation of the values returned in `recentListAtom`. Useful
   * when some information displayed (ie: playlist cover/name) changes or
   * gets deleted.
   */
  static async refresh() {
    await setAtom(recentListSourcesAsyncAtom, async (prevList) => {
      return [...(await prevList)];
    });
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
    if (Array.isArray(removedRefs)) await RecentList.removeEntries(removedRefs);
    else await RecentList.removeEntry(removedRefs);

    // Check if we were playing this list.
    const currSource = await getAtom(playingSourceAsyncAtom);
    if (!currSource) return;

    const isPlayingRef = Array.isArray(removedRefs)
      ? RecentList.isInRecentList(currSource, removedRefs)
      : arePlaybackSourceEqual(currSource, removedRefs);
    if (isPlayingRef) resetState();
  }

  /** Resynchronize when we update the artwork. */
  static async onImage() {
    await RecentList.refresh();
  }

  /** Resynchronize when we rename a playlist. */
  static async onRename({
    oldEntry,
    newEntry,
  }: Record<"oldEntry" | "newEntry", PlayListSource>) {
    await RecentList.replaceEntry({ oldEntry, newEntry });

    // Check if we were playing this list.
    const currSource = await getAtom(playingSourceAsyncAtom);
    if (!currSource) return;

    const isPlayingRef = arePlaybackSourceEqual(currSource, oldEntry);
    if (isPlayingRef) await setAtom(playingSourceAsyncAtom, newEntry);
  }

  /** Resynchronize when we update the tracks in a media list. */
  static async onTracks(ref: PlayListSource) {
    await RecentList.refresh();

    // Check if we were playing this list.
    const currSource = await getAtom(playingSourceAsyncAtom);
    if (!currSource) return;
    const isPlayingRef = arePlaybackSourceEqual(currSource, ref);
    if (!isPlayingRef) return;

    // We need to keep in mind that `currPlayingIdAsyncAtom` might be
    // part of `queueListAsyncAtom`.
    const isShuffle = await getAtom(shuffleAsyncAtom);
    const oldIndex = await getAtom(currPlayingIdxAsyncAtom);
    const playingList = await getAtom(playingListAsyncAtom);
    const shuffledPlayingList = await getAtom(shuffledPlayingListAsyncAtom);
    const currTrackId = isShuffle
      ? shuffledPlayingList[oldIndex]
      : playingList[oldIndex];

    // Make sure our track lists along with the current index are up-to-date.
    const newUnshuffled = (await getTrackList(currSource)).map(({ id }) => id);
    const newShuffled = shuffleArray(newUnshuffled);
    const newIndex = isShuffle
      ? newShuffled.findIndex((id) => id === currTrackId)
      : newUnshuffled.findIndex((id) => id === currTrackId);

    // Update state.
    await setAtom(playingListAsyncAtom, newUnshuffled);
    await setAtom(shuffledPlayingListAsyncAtom, newShuffled);
    await setAtom(currPlayingIdxAsyncAtom, newIndex === -1 ? 0 : newIndex);

    // Check to see if active track is the new `currTrackId`. If not, "add
    // the active track to the queue".
    const activeTrackId = await getAtom(currPlayingIdAsyncAtom);
    const newCurrTrackId = isShuffle
      ? newShuffled[newIndex]
      : newUnshuffled[newIndex];
    await setAtom(isInQueueAsyncAtom, activeTrackId !== newCurrTrackId);

    // FIXME: Need to add logic to update the next playing track in the RNTP queue.
  }
}
//#endregion

//#region Reset Function
/** Resets the persistent state when something goes wrong. */
export async function resetState() {
  setAtom(playingSourceAsyncAtom, RESET);
  setAtom(playingListAsyncAtom, RESET);
  setAtom(shuffledPlayingListAsyncAtom, RESET);
  setAtom(currPlayingIdxAsyncAtom, RESET);
  setAtom(currPlayingIdAsyncAtom, RESET);
  setAtom(isInQueueAsyncAtom, RESET);
  setAtom(queueListAsyncAtom, RESET);
  await TrackPlayer.reset();
}
//#endregion
