import { atom } from "jotai";
import { RESET, unwrap } from "jotai/utils";

import { db } from "@/db";
import type { TTrackSrc } from "../utils/trackList";

import { createAtomWithStorage } from "@/lib/jotai";

/**
 * @description Structure of the data store in AsyncStorage about the
 *  current playing media.
 */
export type TPlayingInfo = {
  /** Id of the current playing track. */
  trackId: string | undefined;
  /** Information about the list of tracks `trackId` can come from. */
  listSrc: TTrackSrc | undefined;
  /** List of track ids we can play from. */
  trackList: string[];
  /** Index of `trackId` in `trackList`. */
  trackIdx: number;
};

/**
 * @description Default structure of the data we'll store in AsyncStorage
 *  related to the current playing media.
 */
export const DefaultPlayingInformation: TPlayingInfo = {
  trackId: undefined,
  listSrc: undefined,
  trackList: [],
  trackIdx: 0,
};

/** @description [FOR INTERNAL USE ONLY] */
export const playingInfoAsyncAtom = createAtomWithStorage<TPlayingInfo>(
  "playing-info",
  DefaultPlayingInformation,
);
const playingInfoUnwrapAtom = unwrap(
  playingInfoAsyncAtom,
  (prev) => prev ?? DefaultPlayingInformation,
);
/**
 * @description Read-only atom returning information about the current
 *  playing track (ie: track id, track list source).
 */
export const playingInfoAtom = atom((get) => get(playingInfoUnwrapAtom));

/**
 * @description Asynchronous write-only atom for resetting `playingInfoAtom`
 *  to its default values.
 */
export const resetPlayingInfoAtom = atom(null, async (_get, set) => {
  set(playingInfoAsyncAtom, RESET);
});

/**
 * @description [FOR INTERNAL USE ONLY] Read-only atom that asynchronously
 *  fetch information about the current track.
 */
export const currentTrackDataAsyncAtom = atom(async (get) => {
  try {
    const { trackId } = await get(playingInfoAsyncAtom);
    if (!trackId) throw new Error("No track id found.");
    const currTrack = await db.query.tracks.findFirst({
      where: (fields, { eq }) => eq(fields.id, trackId),
      columns: { albumId: false, track: false, modificationTime: false },
      with: { album: { columns: { id: true, name: true, coverSrc: true } } },
    });
    if (!currTrack) throw new Error(`Track (${trackId}) doesn't exist.`);
    const { album, coverSrc, ...rest } = currTrack;
    return {
      ...rest,
      album: album ? { id: album.id, name: album.name } : null,
      coverSrc: album?.coverSrc ?? coverSrc,
    };
  } catch (err) {
    return undefined;
  }
});
/** @description Information about the current track. */
export const currentTrackDataAtom = unwrap(
  currentTrackDataAsyncAtom,
  (prev) => prev ?? undefined,
);

/** @description Current track position in milliseconds. */
export const trackPositionMs = atom(0);
