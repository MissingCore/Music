import type { Artwork, TrackArtwork } from "./track.utils";
import { getTrackArtwork } from "./track.utils";

/** Get artwork representing playlist. */
export function getPlaylistArtwork(playlist: {
  artwork: Artwork;
  tracks: TrackArtwork[];
}) {
  return playlist.artwork ?? getCollage(playlist.tracks);
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
