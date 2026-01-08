import i18next from "~/modules/i18n";

import { ReservedNames } from "~/modules/media/constants";
import type { Artwork, TrackArtwork } from "./track.utils";
import { getTrackArtwork } from "./track.utils";

/** Get artwork representing playlist. */
export function getPlaylistArtwork(playlist: {
  artwork: Artwork;
  tracks: TrackArtwork[];
}) {
  return playlist.artwork ?? getCollage(playlist.tracks);
}

/**
 * Returns sanitize playlist name after checking to see if it's valid based
 * on other metrics. Throws error on failure.
 */
export function sanitizePlaylistName(name: string) {
  const sanitized = name.trim();

  let errMsg: string | undefined;
  if (ReservedNames.has(sanitized)) errMsg = i18next.t("err.msg.usedName");
  if (sanitized.length === 0) errMsg = i18next.t("err.msg.noContent");

  if (errMsg) throw new Error(errMsg);

  return sanitized;
}

//#region Internal
/**
 * Create a collage from the first 4 tracks with artwork. We assume the
 * `TrackArtwork[]` passed is already sorted.
 */
function getCollage(tracks: TrackArtwork[]) {
  return tracks
    .map((track) => getTrackArtwork(track))
    .filter((artwork) => artwork !== null)
    .slice(0, 4);
}
//#endregion
