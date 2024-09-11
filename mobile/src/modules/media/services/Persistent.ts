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

import type { TrackWithAlbum } from "@/db/schema";
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
    const currPlayView = await get(_playViewRefAtom);
    const { source } = await get(_playListRefAtom);

    // Update the current playing queue if we shuffle/unshuffle it.
    if (source) {
      const { trackIndex, tracks } = await generatePlayList({
        source,
        shouldShuffle: newShuffleStatus,
        startTrackId: currPlayView.id,
      });
      const newTrack = tracks[trackIndex]!;
      set(_playViewRefAtom, { id: newTrack.id, listIndex: trackIndex });
      set(_playListRefAtom, { source, trackIds: tracks.map(({ id }) => id) });

      // Only update RNTP queue if it's loaded.
      if (await isRNTPLoaded()) {
        await replaceAroundTrack({
          tracks,
          oldIndex: currPlayView.listIndex,
          newIndex: trackIndex,
        });
      }
    }

    set(_shuffleAtom, newShuffleStatus);
  },
);
//#endregion

//#region Play View
type StoredPlayView = {
  /** Current track id. */
  id: string | undefined;
  track: TrackWithAlbum | undefined;
  /** Index of track in play list. */
  listIndex: number;
};
const DEFAULT_PLAY_VIEW_REF = { id: undefined, listIndex: 0 };
const DEFAULT_PLAY_VIEW = { ...DEFAULT_PLAY_VIEW_REF, track: undefined };

export const _playViewRefAtom = createAtomWithStorage<
  Omit<StoredPlayView, "track">
>("play-view", DEFAULT_PLAY_VIEW_REF);
export const _playViewAtom = atom<Promise<StoredPlayView>>(async (get) => {
  const { id, listIndex } = await get(_playViewRefAtom);
  if (!id) return DEFAULT_PLAY_VIEW;
  try {
    const track = await getTrack([eq(tracks.id, id)]);
    return { id, listIndex, track };
  } catch {
    // Track doesn't exist.
    return DEFAULT_PLAY_VIEW;
  }
});
/** Information about the current track. */
export const playViewAtom = unwrap(
  _playViewAtom,
  (prev) => prev ?? DEFAULT_PLAY_VIEW,
);
//#endregion

//#region Play List
export const DEFAULT_PLAY_LIST_REF = { source: undefined, trackIds: [] };

export const _playListRefAtom = createAtomWithStorage<{
  source: PlayListSource | undefined;
  trackIds: string[];
}>("play-list-reference", DEFAULT_PLAY_LIST_REF);
/** Reference of the media list being played. */
export const playListRefAtom = unwrap(
  _playListRefAtom,
  (prev) => prev ?? DEFAULT_PLAY_LIST_REF,
);
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
  set(_playViewRefAtom, RESET);
  set(_playListRefAtom, RESET);
  set(_queueAtom, RESET);
  await TrackPlayer.reset();
});
//#endregion
