import type { AddTrack } from "@weights-ai/react-native-track-player";

import type { TrackWithRelations } from "~/db/schema";

import i18next from "~/modules/i18n";
import { getArtistsString } from "~/api/artist.utils";
import { getPlaylist } from "~/api/playlist";
import { getSortedTracks } from "~/api/track";
import { getTrackArtwork } from "~/api/track.utils";
import { getAlbumDetails, getAlbumTracks } from "~/data/album/api";
import { getArtistTracks } from "~/data/artist/api";
import { getFolderTracks } from "~/data/folder/api";
import { getGenreTracks } from "~/data/genre/api";
import type { PlayFromSource } from "./types";

import { shuffleArray } from "~/utils/object";
import { getSafeUri } from "~/utils/string";
import {
  FavoritesPlaylistKey,
  ReservedNames,
  ReservedPlaylists,
} from "~/modules/media/constants";

/** Check if 2 `PlayFromSource` are equivalent. */
export function arePlaybackSourceEqual(
  source1: PlayFromSource | undefined,
  source2: PlayFromSource,
) {
  if (!source1) return false;
  const keys = Object.keys(source1) as Array<keyof PlayFromSource>;
  return keys.every((key) => source1[key] === source2[key]);
}

/** Extract the track id if formatted as `${track_id}__${unique_id}`. */
export function extractTrackId(key: string) {
  return key.split("__")[0]!;
}

/** Format track data to be used with the RNTP queue. */
export function formatTrackforPlayer(track: TrackWithRelations) {
  return {
    url: getSafeUri(track.uri),
    artwork: getTrackArtwork(track) ?? undefined,
    title: track.name,
    artist: getArtistsString(track.tracksToArtists, false) || "No Artist",
    album: track.album?.name ?? undefined,
    duration: track.duration,
    id: track.id,
  } satisfies AddTrack;
}

/** Returns the name of the `PlayFromSource`. */
export async function getSourceName({ type, id }: PlayFromSource) {
  let name = "";
  try {
    if (type === "artist" || type === "genre") {
      name = id;
    } else if (type === "playlist") {
      name = id;
      if (id === FavoritesPlaylistKey) name = i18next.t("term.favoriteTracks");
      else if (id === ReservedPlaylists.tracks) name = i18next.t("term.tracks");
    } else if (type === "folder") {
      // FIXME: At `-2` index due to the folder path (in `id`) ending with
      // a trailing slash.
      name = id.split("/").at(-2) ?? "";
    } else {
      name = (await getAlbumDetails(id)).name;
    }
  } catch {}
  return name;
}

//#region List Utils
/** Get list of tracks ids from a `PlayFromSource`. */
export async function getTrackIdsList({ type, id }: PlayFromSource) {
  let trackIds: string[] = [];

  try {
    if (type === "album") {
      const data = await getAlbumTracks(id, true);
      trackIds = data.map((t) => t.id);
    } else if (type === "artist") {
      const data = await getArtistTracks(id, true);
      trackIds = data.map((t) => t.id);
    } else if (type === "folder") {
      const data = await getFolderTracks(id, true); // `id` contains pathname.
      trackIds = data.map((t) => t.id);
    } else if (type === "genre") {
      const data = await getGenreTracks(id, true);
      trackIds = data.map((t) => t.id);
    } else {
      if (ReservedNames.has(id)) {
        const sortedTracks = await getSortedTracks("sortedIds");
        trackIds = sortedTracks.map(({ id }) => id);
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

/** Returns information necessary to switch `queue` seamlessly. */
export function getUpdatedLists(
  newPlayingList: string[],
  shuffle: boolean,
  startTrackId?: string,
) {
  const usedList = shuffle ? shuffleArray(newPlayingList) : newPlayingList;

  // Get the index we should start at in the new list.
  const newLocation =
    startTrackId !== undefined
      ? usedList.findIndex((tId) => startTrackId === tId)
      : -1;

  return {
    orderSnapshot: newPlayingList,
    queue: usedList,
    queuePosition: newLocation === -1 ? 0 : newLocation,
    //? Reset `numQueuedNext` as the queue gets reset to its original state.
    numQueuedNext: 0,
  };
}
//#endregion
