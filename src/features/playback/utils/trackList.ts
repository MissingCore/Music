import { db } from "@/db";

import { compareAsc } from "@/utils/string";
import type { MediaList } from "@/components/media/types";

/** @description "Enums" for special playlists. */
export const SpecialPlaylists = {
  favorites: "Favorite Tracks",
  tracks: "Tracks",
} as const;

export type TTrackSrc = {
  type: MediaList;
  name: string;
  id: string;
};

/** @description Get the list of track ids in a given track list. */
export async function getTrackList({ type, id }: TTrackSrc) {
  let unflattenTrackList: Array<{ id: string }> = [];
  if (type === "album") {
    unflattenTrackList = await db.query.tracks.findMany({
      where: (fields, { eq }) => eq(fields.albumId, id),
      orderBy: (fields, { asc }) => [asc(fields.track)],
      columns: { id: true },
    });
  } else if (type === "artist") {
    const unsortedArtistTracks = await db.query.tracks.findMany({
      where: (fields, { eq }) => eq(fields.artistName, id),
      columns: { id: true, name: true },
      with: { album: { columns: { name: true } } },
    });
    unflattenTrackList = unsortedArtistTracks
      .toSorted(
        (a, b) =>
          compareAsc(a.album?.name, b.album?.name) ||
          compareAsc(a.name, b.name),
      )
      .map(({ id }) => ({ id }));
  } else {
    switch (id) {
      case SpecialPlaylists.tracks:
        unflattenTrackList = await db.query.tracks.findMany({
          orderBy: (fields, { asc }) => [asc(fields.name)],
          columns: { id: true },
        });
        break;
      case SpecialPlaylists.favorites:
        unflattenTrackList = await db.query.tracks.findMany({
          where: (fields, { eq }) => eq(fields.isFavorite, true),
          orderBy: (fields, { asc }) => [asc(fields.name)],
          columns: { id: true },
        });
        break;
      default: {
        const unsortedTracks = await db.query.tracksToPlaylists.findMany({
          where: (fields, { eq }) => eq(fields.playlistName, id),
          columns: { trackId: true },
          with: { track: { columns: { name: true } } },
        });
        unflattenTrackList = unsortedTracks
          .toSorted((a, b) => a.track.name.localeCompare(b.track.name))
          .map(({ trackId }) => ({ id: trackId }));
      }
    }
  }

  return unflattenTrackList.map(({ id }) => id);
}

/**
 * @description Shuffle a list of strings with the modern version of
 *  `Fisher-Yates` Algorithm by Richard Durstenfeld.
 *  - https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
 */
export function shuffle(arr: string[]) {
  const arrCpy = [...arr];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arrCpy[j], arrCpy[i]] = [arrCpy[i], arrCpy[j]];
  }
  return arrCpy;
}
