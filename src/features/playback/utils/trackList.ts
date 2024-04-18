import { db } from "@/db";

import { compareAsc } from "@/utils/string";

/** @description "Enums" for special playlists. */
export const SpecialPlaylists = {
  favorites: "favorite-tracks",
  tracks: "all-tracks",
} as const;

export type TTrackSrc = { type: "album" | "artist" | "playlist"; ref: string };

/** @description Get the list of track ids in a given track list. */
export async function getTrackList({ type, ref }: TTrackSrc) {
  let unflattenTrackList = [] as { id: string }[];
  if (type === "album") {
    unflattenTrackList = await db.query.tracks.findMany({
      where: (fields, { eq }) => eq(fields.albumId, ref),
      orderBy: (fields, { asc }) => [asc(fields.track)],
      columns: { id: true },
    });
  } else if (type === "artist") {
    const unsortedArtistTracks = await db.query.tracks.findMany({
      where: (fields, { eq }) => eq(fields.artistName, ref),
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
    switch (ref) {
      case SpecialPlaylists.tracks:
        unflattenTrackList = await db.query.tracks.findMany({
          columns: { id: true },
          orderBy: (fields, { asc }) => [asc(fields.name)],
        });
        break;
      case SpecialPlaylists.favorites:
        unflattenTrackList = await db.query.tracks.findMany({
          where: (fields, { eq }) => eq(fields.isFavorite, true),
          columns: { id: true },
          orderBy: (fields, { asc }) => [asc(fields.name)],
        });
        break;
      default:
        throw new Error("Playlist feature not implemented.");
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
