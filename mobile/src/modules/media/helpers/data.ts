/**
 * Helpers for fetching & comparing data/information for the Media
 * Player Interface.
 */

import type { AddTrack } from "@weights-ai/react-native-track-player";

import type { TrackWithAlbum } from "~/db/schema";
import { getTrackCover } from "~/db/utils";

import i18next from "~/modules/i18n";
import { getAlbum } from "~/api/album";
import { getArtist } from "~/api/artist";
import { getFolderTracks } from "~/api/folder";
import { getPlaylist, getSpecialPlaylist } from "~/api/playlist";

import { getSafeUri } from "~/utils/string";
import type { ReservedPlaylistName } from "../constants";
import { ReservedNames, ReservedPlaylists } from "../constants";
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

/** See if a `PlayListSource` exists in the list of sources. */
export function isPlaybackSourceInList(
  source: PlayListSource,
  sourceList: PlayListSource[],
) {
  const atIndex = sourceList.findIndex((listSource) =>
    arePlaybackSourceEqual(source, listSource),
  );
  return [atIndex !== -1, atIndex] as const;
}

/** Format track data to be used with the RNTP queue. */
export function formatTrackforPlayer(track: TrackWithAlbum) {
  return {
    url: getSafeUri(track.uri),
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
    if (ReservedNames.has(id)) {
      const tKey = id === ReservedPlaylists.tracks ? "t" : "favoriteT";
      name = i18next.t(`term.${tKey}racks`);
    } else if (type === "artist" || type === "playlist") {
      name = id;
    } else if (type === "folder") {
      // FIXME: At `-2` index due to the folder path (in `id`) ending with
      // a trailing slash.
      name = id.split("/").at(-2) ?? "";
    } else {
      name = (await getAlbum(id, { columns: ["name"], withTracks: false }))
        .name;
    }
  } catch {}
  return name;
}

/** Get list of tracks ids from a `PlayListSource`. */
export async function getTrackIdsList({ type, id }: PlayListSource) {
  let trackIds: string[] = [];

  try {
    if (type === "album") {
      const data = await getAlbum(id, {
        columns: [],
        trackColumns: ["id"],
      });
      trackIds = data.tracks.map(({ id }) => id);
    } else if (type === "artist") {
      const data = await getArtist(id, {
        columns: [],
        trackColumns: ["id"],
        withAlbum: false,
      });
      trackIds = data.tracks.map(({ id }) => id);
    } else if (type === "folder") {
      const data = await getFolderTracks(id); // `id` contains pathname.
      trackIds = data.map(({ id }) => id);
    } else {
      if (ReservedNames.has(id)) {
        const data = await getSpecialPlaylist(id as ReservedPlaylistName, {
          columns: [],
          trackColumns: ["id"],
          withAlbum: false,
        });
        trackIds = data.tracks.map(({ id }) => id);
      } else {
        const data = await getPlaylist(id, {
          columns: [],
          trackColumns: ["id"],
          withAlbum: false,
        });
        trackIds = data.tracks.map(({ id }) => id);
      }
    }
  } catch {}

  return trackIds;
}
