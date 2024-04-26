import type { TTrackSrc } from "./trackList";

/** @description Compares 2 `TTrackSrc` values and see if they're equal. */
export function isTrackSrcsEqual(src1: TTrackSrc | undefined, src2: TTrackSrc) {
  if (!src1) return false;
  return (
    src1.type === src2.type && src1.name === src2.name && src1.id === src2.id
  );
}
