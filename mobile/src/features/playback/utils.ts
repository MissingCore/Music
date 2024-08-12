import { eq } from "drizzle-orm";

import type { Track } from "@/db/schema";
import { playlists, tracks } from "@/db/schema";
import { getPlaylist, getTracks } from "@/db/queries";
import { formatAsTrackIdList } from "@/db/utils/formatters";
import { sortTracks } from "@/db/utils/sorting";

import { getFolderTracks } from "@/api/file-nodes/[...id]";
import { SpecialPlaylists } from "./constants";
import type { TrackListSource } from "./types";

import { shuffleArray } from "@/utils/object";

/** See if 2 `TrackListSource` are the "same". */
export function areTrackReferencesEqual(
  source1: TrackListSource | undefined,
  source2: TrackListSource,
) {
  if (!source1) return false;
  const keys = Object.keys(source1) as Array<keyof TrackListSource>;
  return keys.every((key) => source1[key] === source2[key]);
}

/** Get the list of track ids in a given track list. */
export async function getTrackList({ type, id }: TrackListSource) {
  let sortedTracks: Track[] = [];

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
    if (id === SpecialPlaylists.tracks) {
      const data = await getTracks();
      sortedTracks = sortTracks({ type: "track", tracks: data });
    } else if (id === SpecialPlaylists.favorites) {
      const data = await getTracks([eq(tracks.isFavorite, true)]);
      sortedTracks = sortTracks({ type: "track", tracks: data });
    } else {
      const data = await getPlaylist([eq(playlists.name, id)]);
      sortedTracks = sortTracks({ type: "playlist", tracks: data.tracks });
    }
  }

  return formatAsTrackIdList(sortedTracks);
}

/** Return information about a refreshed track list when change occurs. */
export async function refreshTrackListData(props: {
  listSource: TrackListSource;
  shuffle?: boolean;
  startingTrack?: string | undefined;
}) {
  const { listSource, shuffle = false, startingTrack = undefined } = props;

  let newTrackList = await getTrackList(listSource);
  if (newTrackList.length === 0) return { listIndex: 0, trackList: [] };
  if (shuffle) newTrackList = shuffleArray(newTrackList);
  const newTrackListAsSet = new Set(newTrackList);

  let newListIndex = 0;
  if (startingTrack && newTrackListAsSet.has(startingTrack)) {
    if (shuffle) {
      newTrackList = [
        startingTrack,
        ...newTrackList.filter((id) => id !== startingTrack),
      ];
    } else {
      newListIndex = newTrackList.findIndex((id) => id === startingTrack);
    }
  }

  return { listIndex: newListIndex, trackList: newTrackList };
}
