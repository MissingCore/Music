import i18next from "~/modules/i18n";
import { getAlbumDetails, getAlbumTracks } from "~/data/album/api";
import { getArtistTracks } from "~/data/artist/api";
import { getFolderTracks } from "~/data/folder/api";
import { getGenreTracks } from "~/data/genre/api";
import { getPlaylistTracks } from "~/data/playlist/api";
import { getSortedTracks } from "~/data/track/api";
import type { PlayFromSource } from "./types";

import { shuffleArray } from "~/utils/object";
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
  let trackIds: Array<{ id: string }> = [];

  try {
    if (type === "album") trackIds = await getAlbumTracks(id, true);
    else if (type === "artist") trackIds = await getArtistTracks(id, true);
    else if (type === "folder") trackIds = await getFolderTracks(id, true);
    else if (type === "genre") trackIds = await getGenreTracks(id, true);
    else if (ReservedNames.has(id)) trackIds = await getSortedTracks(true);
    else trackIds = await getPlaylistTracks(id, true);
  } catch {}

  return trackIds.map((t) => t.id);
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
