import { asc } from "drizzle-orm";

import { db } from "@/db";
import { albums, tracks } from "@/db/schema";

/** @description Return all albums w/ their artist name & track count. */
export async function getAlbums() {
  const allAlbums = await db.query.albums.findMany({
    with: {
      artist: { columns: { name: true } },
      tracks: { columns: { id: true } },
    },
    orderBy: [asc(albums.name)],
  });
  return allAlbums.map(({ tracks, artist, ...rest }) => {
    return { ...rest, numTracks: tracks.length, artistName: artist.name };
  });
}

/**
 * @description Return all tracks w/ their artist name & cover inherited
 * from its album.
 */
export async function getTracks() {
  const allTracks = await db.query.tracks.findMany({
    with: {
      artist: { columns: { name: true } },
      album: { columns: { coverSrc: true } },
    },
    orderBy: [asc(tracks.name)],
  });
  return allTracks.map(({ artist, album, coverSrc, ...rest }) => ({
    ...rest,
    artistName: artist.name,
    coverSrc: album?.coverSrc ?? coverSrc,
  }));
}
