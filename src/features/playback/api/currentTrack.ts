import { atom } from "jotai";
import { unwrap } from "jotai/utils";

import { db } from "@/db";

import { createAtomWithStorage } from "@/lib/jotai";

/** @description Returns the current track id stored in `AsyncStorage`. */
export const currentTrackIdAtom = createAtomWithStorage<string | undefined>(
  "current-track-id",
  undefined,
);

/**
 * @description [FOR INTERNAL USE ONLY] Read-only atom that asynchronously
 *  fetch information about the current track.
 */
export const currentTrackDataAsyncAtom = atom(async (get) => {
  try {
    const trackId = await get(currentTrackIdAtom);
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
/** @description Returns information about the current track. */
export const currentTrackDataAtom = unwrap(
  currentTrackDataAsyncAtom,
  (prev) => prev ?? undefined,
);
