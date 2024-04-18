import { atom } from "jotai";
import { unwrap } from "jotai/utils";

import { db } from "@/db";
import type { TTrackSrc } from "../utils/trackList";
import { SpecialPlaylists } from "../utils/trackList";

import { createAtomWithStorage } from "@/lib/jotai";

/** @description [FOR INTERNAL USE ONLY] */
export const trackListSrcAsyncAtom = createAtomWithStorage<
  TTrackSrc | undefined
>("track-list-src", undefined);
/**  @description Information about the source of the track list. */
export const trackListSrcAtom = unwrap(
  trackListSrcAsyncAtom,
  (prev) => prev ?? undefined,
);

const trackListNameAsyncAtom = atom(async (get) => {
  try {
    const trackListSrc = await get(trackListSrcAsyncAtom);
    if (!trackListSrc) throw new Error("No track list source found.");
    let sourceName = "";
    if (trackListSrc.type === "album") {
      sourceName = (await db.query.albums.findFirst({
        where: (fields, { eq }) => eq(fields.id, trackListSrc.ref),
        columns: { name: true },
      }))!.name;
    } else if (trackListSrc.type === "artist") {
      sourceName = `Artist\n ${
        (await db.query.artists.findFirst({
          where: (fields, { eq }) => eq(fields.name, trackListSrc.ref),
          columns: { name: true },
        }))!.name
      }`;
    } else {
      switch (trackListSrc.ref) {
        case SpecialPlaylists.tracks:
          sourceName = "Tracks";
          break;
        case SpecialPlaylists.favorites:
          sourceName = "Favorite Tracks";
          break;
        default:
          throw new Error("Playlist feature not implemented.");
      }
    }

    return sourceName;
  } catch (err) {
    return "";
  }
});
/** @description Name of the current track list. */
export const trackListNameAtom = unwrap(
  trackListNameAsyncAtom,
  (prev) => prev ?? "",
);

/** @description [FOR INTERNAL USE ONLY] */
export const trackListAsyncAtom = createAtomWithStorage<string[]>(
  "track-list",
  [],
);
/**  @description List of track ids that we'll be playing. */
export const trackListAtom = unwrap(trackListAsyncAtom, (prev) => prev ?? []);

/** @description [FOR INTERNAL USE ONLY] */
export const trackListIndexAsyncAtom = createAtomWithStorage(
  "track-list-index",
  0,
);
/**  @description Index of the current track we're playing in `trackListAtom`. */
export const trackListIndexAtom = unwrap(
  trackListIndexAsyncAtom,
  (prev) => prev ?? 0,
);

/** @description [FOR INTERNAL USE ONLY] */
export const repeatAsyncAtom = createAtomWithStorage("repeat", false);
/** @description If we should loop after reaching the end of the track list. */
export const repeatAtom = unwrap(repeatAsyncAtom, (prev) => prev ?? false);

/** @description [FOR INTERNAL USE ONLY] */
export const shuffleAsyncAtom = createAtomWithStorage("shuffle", false);
/** @description If the next track should be "random". */
export const shuffleAtom = unwrap(shuffleAsyncAtom, (prev) => prev ?? false);
