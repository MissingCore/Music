import type { Track } from "../schema";

import { compareAsc } from "@/utils/string";
import type { MediaType } from "@/modules/media/types";
import { isTrackWithAlbum } from "./narrowing";

/** Sort tracks based on algorithm for the given media. */
export function sortTracks<TData extends Track>({
  type,
  tracks,
}: {
  type: MediaType;
  tracks: TData[];
}) {
  return [...tracks].sort((a, b) => {
    if (type !== "album" && type !== "artist") {
      return a.name.localeCompare(b.name);
    } else if (type === "album") {
      return a.track - b.track;
    } else if (isTrackWithAlbum(a) && isTrackWithAlbum(b)) {
      // Only true when `type === "artist"`.
      return (
        compareAsc(a.name, b.name) || compareAsc(a.album?.name, b.album?.name)
      );
    } else {
      throw new Error(
        'Expected `TrackWithAlbum[]` instead of `Track[]` for `type === "artist"`.',
      );
    }
  });
}
