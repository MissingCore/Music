import type { AddTrack } from "react-native-track-player";

import type { Track } from "./types";
import { getArtistsString } from "../artist/utils";

import { getSafeUri } from "~/utils/string";

const MusicGlyph = require("~/resources/images/music-glyph.png");

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
    url: getSafeUri(track.uri),
    artwork: track.artwork || MusicGlyph,
    title: track.name,
    artist: getArtistsString(track.artists, "No Artist"),
    album: track.album || undefined,
    duration: track.duration,
    id: track.id,
  } satisfies AddTrack;
}
