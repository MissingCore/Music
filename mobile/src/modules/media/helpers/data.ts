/**
 * Helpers for fetching & comparing data/information for the Media
 * Player Interface.
 */

import type { AddTrack } from "@weights-ai/react-native-track-player";
import type { Href } from "expo-router";

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

/** Get the link to a media list. */
export function getSourceLink<T extends PlayListSource | undefined>(
  props: T,
): undefined extends T ? undefined : Href {
  // @ts-expect-error - Return type is correct.
  if (!props) return;
  const { type, id } = props;
  // @ts-expect-error - Return type is correct.
  if (type === "playlist" && id === ReservedPlaylists.tracks) return "/track";
  else if (type === "folder")
    // @ts-expect-error - Return type is correct.
    return `/folder?path=${encodeURIComponent(id)}` satisfies Href;
  // @ts-expect-error - Return type is correct.
  return `/${type}/${encodeURIComponent(id)}` satisfies Href;
}

/** Get list of tracks from a `PlayListSource`. */
export async function getTrackList({ type, id }: PlayListSource) {
  let sortedTracks: TrackWithAlbum[] = [];

  try {
    if (type === "album") {
      const { tracks: trks, ...albumInfo } = await getAlbum(id);
      sortedTracks = (trks as TrackWithAlbum[]).map((track) => {
        track.album = albumInfo;
        return track;
      });
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
        sortedTracks = data.tracks;
      }
    }
  } catch {}

  return sortedTracks;
}
