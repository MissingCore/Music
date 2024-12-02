/**
 * Helpers for fetching & comparing data/information for the Media
 * Player Interface.
 */

import { inArray } from "drizzle-orm";
import type { AddTrack } from "react-native-track-player";

import type { TrackWithAlbum } from "@/db/schema";
import { tracks } from "@/db/schema";
import { getTrackCover } from "@/db/utils";

import { getAlbum } from "@/api/album";
import { getArtist } from "@/api/artist";
import { getFolderTracks } from "@/api/folder";
import { getPlaylist, getSpecialPlaylist } from "@/api/playlist";
import { getTracks } from "@/api/track";

import type { ReservedPlaylistName } from "../constants";
import { ReservedNames } from "../constants";
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

/** Returns the name of the `PlayListSource`. */
export async function getSourceName({ type, id }: PlayListSource) {
  let name = "";
  try {
    if (ReservedNames.has(id) || ["artist", "playlist"].includes(type)) {
      name = id;
    } else if (type === "folder") {
      // FIXME: At `-2` index due to the folder path (in `id`) ending with
      // a trailing slash.
      name = id.split("/").at(-2) ?? "";
    } else {
      name = (await getAlbum(id)).name; // `type` should be `album`.
    }
  } catch {}
  return name;
}

/** Get list of tracks from a `PlayListSource`. */
export async function getTrackList({ type, id }: PlayListSource) {
  let sortedTracks: TrackWithAlbum[] = [];

  if (type === "album") {
    const { tracks: trks, ...albumInfo } = await getAlbum(id);
    sortedTracks = trks.map((track) => ({ ...track, album: albumInfo }));
  } else if (type === "artist") {
    const data = await getArtist(id);
    sortedTracks = data.tracks;
  } else if (type === "folder") {
    sortedTracks = await getFolderTracks(id); // `id` contains pathname.
  } else {
    if (ReservedNames.has(id)) {
      sortedTracks = (await getSpecialPlaylist(id as ReservedPlaylistName))
        .tracks;
    } else {
      const data = await getPlaylist(id);
      // FIXME: As of now, playlists don't have a "defined" sorting order.
      // In the future, we'll allow the user to have custom track ordering
      // in the playlist.
      sortedTracks = data.tracks;
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
