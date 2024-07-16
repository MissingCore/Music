import type { Track, TrackWithAlbum } from "../schema";

import { compareAsc } from "@/utils/string";
import type { Media } from "@/components/media/types";
import { isTrackWithAlbum } from "./narrowing";

/** Sort tracks based on algorithm for the given media. */
export function sortTracks({
  type,
  tracks,
}: {
  type: Media;
  tracks: Track[] | TrackWithAlbum[];
}) {
  return [...tracks].sort((a, b) => {
    if (type === "playlist" || type === "track") {
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
