/**
 * Helpers for fetching & comparing data/information for the Media
 * Player Interface.
 */

import { eq, inArray } from "drizzle-orm";
import type { AddTrack } from "react-native-track-player";

import type { TrackWithAlbum } from "@/db/schema";
import { playlists, tracks } from "@/db/schema";
import { getPlaylist, getTracks } from "@/db/queries";
import { getTrackCover } from "@/db/utils/formatters";
import { sortTracks } from "@/db/utils/sorting";

import { getFolderTracks } from "@/api/file-nodes/[...id]";

import { ReservedPlaylists } from "../constants/ReservedNames";
import type { PlayListSource } from "../types";

/** Check if 2 `PlayListSource` are equivalent. */
export function arePlaybackSourceEqual(
  source1: PlayListSource | undefined,
  source2: PlayListSource,
) {
  if (!source1) return false;
  const keys = Object.keys(source1) as Array<keyof PlayListSource>;
  return keys.every((key) => source1[key] === source2[key]);
}

/** Format track data to be used with the RNTP queue. */
export function formatTrackforPlayer(track: TrackWithAlbum) {
  return {
    url: track.uri,
    artwork: getTrackCover(track) ?? undefined,
    title: track.name,
    artist: track.artistName ?? "No Artist",
    duration: track.duration,
    id: track.id,
  } satisfies AddTrack;
}

/** Get list of tracks from a `PlayListSource`. */
export async function getTrackList({ type, id }: PlayListSource) {
  let sortedTracks: TrackWithAlbum[] = [];

  if (type === "album") {
    const data = await getTracks([eq(tracks.albumId, id)]);
    sortedTracks = sortTracks({ type: "album", tracks: data });
  } else if (type === "artist") {
    const data = await getTracks([eq(tracks.artistName, id)]);
    sortedTracks = sortTracks({ type: "artist", tracks: data });
  } else if (type === "folder") {
    const data = await getFolderTracks(id); // `id` contains pathname.
    sortedTracks = sortTracks({ type: "folder", tracks: data });
  } else {
    if (id === ReservedPlaylists.tracks) {
      const data = await getTracks();
      sortedTracks = sortTracks({ type: "track", tracks: data });
    } else if (id === ReservedPlaylists.favorites) {
      const data = await getTracks([eq(tracks.isFavorite, true)]);
      sortedTracks = sortTracks({ type: "track", tracks: data });
    } else {
      const data = await getPlaylist([eq(playlists.name, id)]);
      sortedTracks = sortTracks({ type: "playlist", tracks: data.tracks });
    }
  }

  return sortedTracks;
}

/** Get list of tracks from track ids. */
export async function getTracksFromIds(trackIds: string[]) {
  if (trackIds.length === 0) return [];
  const unorderedTracks = await getTracks([inArray(tracks.id, trackIds)]);
  return trackIds.map((tId) => unorderedTracks.find(({ id }) => id === tId)!);
}
