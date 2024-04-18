import { unwrap } from "jotai/utils";

import type { TTrackSrc } from "../utils/trackList";

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
