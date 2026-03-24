import type { Track as AddTrack } from "react-native-audio-browser";

import type { Track } from "./types";
import { getArtistsString } from "../artist/utils";

import { PlaceholderImageFile } from "~/lib/file-system";
import { getSafeUri } from "~/utils/string";

/**
 * Merge 2 lists of tracks. Tracks that appear in both lists will result
 * in the latest instance of the track being merged so that there'll be
 * no duplicates.
 */
export function mergeTracks<TData extends { id: string }>(
  list1: TData[],
  list2: TData[],
) {
  const trackIds = new Set(list2.map(({ id }) => id));
  return list1.filter(({ id }) => !trackIds.has(id)).concat(list2);
}

/** Format track data to be used with the RNTP queue. */
export function formatTrackforPlayer(track: Track) {
  return {
    src: getSafeUri(track.uri),
    artwork: track.artwork || PlaceholderImageFile,
    title: track.name,
    artist: getArtistsString(track.artists, "No Artist"),
    album: track.album || undefined,
    duration: track.duration,
  } satisfies AddTrack;
}
