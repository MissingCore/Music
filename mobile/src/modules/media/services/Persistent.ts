/**
 * Interface of accessing portions of the Media Player Interface.
 *
 * This file contains variables representing the user preferences on
 * certain media controls along with the Play Queue.
 */

import { eq } from "drizzle-orm";
import { atom, getDefaultStore } from "jotai";
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

import { createAtomWithStorage } from "@/lib/jotai";
import type { MediaCard } from "@/components/media/card";
import { ReservedPlaylists } from "../constants/ReservedNames";
import { arePlaybackSourceEqual, generatePlayList } from "../helpers/data";
import { isRNTPLoaded, replaceAroundTrack } from "../helpers/rntp";
import type { PlayListSource } from "../types";

//#region Repeat
export const _repeatAtom = createAtomWithStorage("repeat", false);
/** Option that determines if playback will continue from the 1st track. */
export const repeatAtom = unwrap(_repeatAtom, (prev) => prev ?? false);
//#endregion

//#region Shuffle
export const _shuffleAtom = createAtomWithStorage("shuffle", false);
const _shuffleUnwrapAtom = unwrap(_shuffleAtom, (prev) => prev ?? false);
/** Option that determines if playback order will be randomized. */
export const shuffleAtom = atom(
  (get) => get(_shuffleUnwrapAtom),
  async (get, set) => {
    const newShuffleStatus = !(await get(_shuffleAtom));
    const startTrackId = await get(_currTrackIdAtom);
    const oldIndex = await get(_currPlayListIdxAtom);
    const source = await get(_playListSourceAtom);

    // Update the current playing queue if we shuffle/unshuffle it.
    if (source) {
      const { trackIndex, tracks } = await generatePlayList({
        source,
        shouldShuffle: newShuffleStatus,
        startTrackId,
      });
      const newTrack = tracks[trackIndex]!;
      set(_currTrackIdAtom, newTrack.id);
      set(_currPlayListIdxAtom, trackIndex);
      set(
        _playListAtom,
        tracks.map(({ id }) => id),
      );

      // Only update RNTP queue if it's loaded.
      if (await isRNTPLoaded()) {
        await replaceAroundTrack({ tracks, oldIndex, newIndex: trackIndex });
      }
    }

    set(_shuffleAtom, newShuffleStatus);
  },
);
//#endregion

//#region Play View
export const _currTrackIdAtom = createAtomWithStorage<string | undefined>(
  "curr-track-id",
  undefined,
);
export const _currPlayListIdxAtom = createAtomWithStorage(
  "curr-play-list-idx",
  0,
);

const _currTrackAtom = atom(async (get) => {
  const trackId = await get(_currTrackIdAtom);
  if (!trackId) return undefined;
  try {
    return getTrack([eq(tracks.id, trackId)]);
  } catch {
    // Track doesn't exist.
    return undefined;
  }
});
/** Information about the current track. */
export const currTrackAtom = unwrap(
  _currTrackAtom,
  (prev) => prev ?? undefined,
);
//#endregion

//#region Play List
export const _playListSourceAtom = createAtomWithStorage<
  PlayListSource | undefined
>("play-list-source", undefined);
/** Identifies where the track list comes from. */
export const playListSourceAtom = unwrap(
  _playListSourceAtom,
  (prev) => prev ?? undefined,
);

export const _playListAtom = createAtomWithStorage<string[]>("play-list", []);
/** The list of tracks from `_playListSourceAtom`. */
export const playListAtom = unwrap(_playListAtom, (prev) => prev ?? []);

const _playListNameAtom = atom(async (get) => {
  const source = await get(_playListSourceAtom);
  if (!source) return "";
  try {
    if (
      (Object.values(ReservedPlaylists) as string[]).includes(source.id) ||
      ["artist", "playlist"].includes(source.type)
    ) {
      return source.id;
    } else if (source.type === "folder") {
      // FIXME: At `-2` index due to the folder path (in `id`) ending with
      // a trailing slash.
      return source.id.split("/").at(-2);
    } else if (source.type === "album") {
      const album = await getAlbum([eq(albums.id, source.id)]);
      return album.name;
    }
    return ""; // Fallback in case we miss anything.
  } catch {
    return ""; // In case the query throws an error.
  }
});
/** Get the name of the current playing track list. */
export const playListNameAtom = unwrap(_playListNameAtom, (prev) => prev ?? "");
//#endregion

//#region Queue
export const _queueAtom = createAtomWithStorage<string[]>("queue", []);
/** List of track ids we want to play after the current track. */
export const queueAtom = unwrap(_queueAtom, (prev) => prev ?? []);

/** Wrapper containing helpers to manipulate the current queue. */
export class Queue {
  /** Add track id at end of current queue. */
  static async add(trackId: string) {
    await getDefaultStore().set(_queueAtom, async (prevQueue) => [
      ...(await prevQueue),
      trackId,
    ]);
    Toast.show("Added track to queue.");
  }

  /** Remove track id at specified index of current queue. */
  static async removeAtIndex(index: number) {
    await getDefaultStore().set(_queueAtom, async (prevQueue) =>
      (await prevQueue).filter((_, i) => i !== index),
    );
  }

  /** Remove list of track ids from the current queue. */
  static async removeIds(ids: string[]) {
    const idsSet = new Set(ids);
    await getDefaultStore().set(_queueAtom, async (prevQueue) =>
      (await prevQueue).filter((trackId) => !idsSet.has(trackId)),
    );
  }
}
//#endregion

//#region Reset Persistent Media
export const resetPersistentMediaAtom = atom(null, async (_, set) => {
  set(_currTrackIdAtom, RESET);
  set(_currPlayListIdxAtom, RESET);
  set(_playListSourceAtom, RESET);
  set(_playListAtom, RESET);
  set(_queueAtom, RESET);
  await TrackPlayer.reset();
});
//#endregion

//#region Recent List
export const _recentListRefAtom = createAtomWithStorage<PlayListSource[]>(
  "recent-list",
  [],
);

export const _recentListAtom = atom(async (get) => {
  const recentRefs = await get(_recentListRefAtom);
  const recentObjs: MediaCard.Content[] = [];

  for (const { id, type } of recentRefs) {
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
      } else {
        // FIXME: Any unexpected lists that we've added gets caught here,
        // which should only be folders.
      }
    } catch (err) {
      console.log(err);
    }
  }

  return recentObjs;
});
/** List of objects of what we've recently played. */
export const recentListAtom = unwrap(_recentListAtom, (prev) => prev ?? []);

/** Wrapper containing helpers to manipulate the recent list. */
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
    await getDefaultStore().set(_recentListRefAtom, async (_prevList) => {
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
    const jotaiStore = getDefaultStore();

    const prevList = await jotaiStore.get(_recentListRefAtom);
    const entryIdx = prevList.findIndex(RecentList.#compare(oldEntry));
    if (entryIdx === -1) return;

    await jotaiStore.set(_recentListRefAtom, [
      ...prevList.slice(0, entryIdx),
      newEntry,
      ...prevList.slice(entryIdx + 1),
    ]);
  }

  /** Remove a specific entry from the recent list. */
  static async removeEntry(removedRef: PlayListSource) {
    await getDefaultStore().set(_recentListRefAtom, async (prevList) =>
      RecentList.#removeRefInList(removedRef, await prevList),
    );
  }

  /** Remove multiple entries in the recent list. */
  static async removeEntries(removedRefs: PlayListSource[]) {
    await getDefaultStore().set(_recentListRefAtom, async (_prevList) => {
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
    await getDefaultStore().set(_recentListRefAtom, async (prevList) => {
      return [...(await prevList)];
    });
  }
}
//#endregion

//#region Resynchronize
/**
 * Update this atom with `Date.now()` to trigger data refetches on all
 * the atoms that use this value.
 */
export const shouldRefreshAtom = atom(0);

/**
 * Wrapper containing helpers to ensure the Jotai store is up-to-date
 * with the changes we make in React Query.
 */
export class Resynchronize {
  /** Resynchronize when we delete one or more media list. */
  static async onDelete(removedRefs: PlayListSource | PlayListSource[]) {
    const jotaiStore = getDefaultStore();

    if (Array.isArray(removedRefs)) await RecentList.removeEntries(removedRefs);
    else await RecentList.removeEntry(removedRefs);

    // Check if we were playing this list.
    const currSource = await jotaiStore.get(_playListSourceAtom);
    if (!currSource) return;

    const isPlayingRef = Array.isArray(removedRefs)
      ? RecentList.isInRecentList(currSource, removedRefs)
      : arePlaybackSourceEqual(currSource, removedRefs);
    if (isPlayingRef) await jotaiStore.set(resetPersistentMediaAtom);
  }

  /** Resynchronize when we rename a playlist. */
  static async onRename({
    oldEntry,
    newEntry,
  }: Record<"oldEntry" | "newEntry", PlayListSource>) {
    const jotaiStore = getDefaultStore();

    await RecentList.replaceEntry({ oldEntry, newEntry });

    // Check if we were playing this list.
    const currSource = await jotaiStore.get(_playListSourceAtom);
    if (!currSource) return;

    const isPlayingRef = arePlaybackSourceEqual(currSource, oldEntry);
    if (isPlayingRef) await jotaiStore.set(_playListSourceAtom, newEntry);
  }
}
//#endregion
