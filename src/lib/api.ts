import { asc } from "drizzle-orm";

import { db } from "@/db";
import { albums } from "@/db/schema";

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
