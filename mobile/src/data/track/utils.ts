import type { AddTrack } from "@weights-ai/react-native-track-player";

import type { Track } from "./types";

import { getSafeUri } from "~/utils/string";

/** Format track data to be used with the RNTP queue. */
export function formatTrackforPlayer(track: Track) {
  return {
    url: getSafeUri(track.uri),
    artwork: track.artwork || undefined,
    title: track.name,
    artist: track.artists?.join(", ") || "No Artist",
    album: track.album || undefined,
    duration: track.duration,
    id: track.id,
  } satisfies AddTrack;
}
