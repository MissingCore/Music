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

import { tracks } from "@/db/schema";
import { getTrack } from "@/db/queries";

import { createAtomWithStorage } from "@/lib/jotai";
import { generatePlayList } from "../helpers/data";
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
