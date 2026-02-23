import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "~/db";
import type { Album } from "~/db/schema";
import { albums, albumsToArtists, artists } from "~/db/schema";

import { iAsc } from "~/lib/drizzle";
import { AlbumArtistsKey } from "./album.utils";
import type { QueryManyWithTracksFn } from "./types";
import { getColumns, withTracks } from "./utils";

//#region GET Methods
const _getAlbums: QueryManyWithTracksFn<Album, false> =
  () => async (options) => {
    return db.query.albums.findMany({
      where: and(...(options?.where ?? [])),
      columns: getColumns(options?.columns),
      with: withTracks(
        {
          ...options,
          orderBy: (fields, { asc }) => [asc(fields.disc), asc(fields.track)],
        },
        { defaultWithAlbum: false, ...options },
      ),
      orderBy: (fields) => [iAsc(fields.name), iAsc(fields.artistsKey)],
    });
  };

/** Get multiple albums. */
export const getAlbums = _getAlbums();
//#endregion

//#region PATCH Methods
/** Update the `favorite` status of an album. */
export async function favoriteAlbum(id: string, isFavorite: boolean) {
  return updateAlbum(id, { isFavorite });
}

/** Update specified album. */
export async function updateAlbum(
  id: string,
  values: Partial<typeof albums.$inferInsert>,
) {
  return db.update(albums).set(values).where(eq(albums.id, id));
}
//#endregion

//#region PUT Methods
/** Create new album entries & its relations, or update existing ones. Returns the created albums. */
export async function upsertAlbums(entries: Array<typeof albums.$inferInsert>) {
  return db.transaction(async (tx) => {
    const results = await tx
      .insert(albums)
      .values(entries)
      .onConflictDoUpdate({
        target: [albums.name, albums.artistsKey],
        // Set `name` to the `name` from the row that wasn't inserted. This
        // allows `.returning()` to return a value.
        set: { name: sql`excluded.name` },
      })
      .returning();

    // Create artists if they don't exist and the new/updated album-artist relations.
    const usedArtists = new Set<string>();
    const albumArtistRels: Array<{ albumId: string; artistName: string }> = [];
    results.forEach(({ id, artistsKey }) => {
      AlbumArtistsKey.deconstruct(artistsKey).forEach((artistName) => {
        usedArtists.add(artistName);
        albumArtistRels.push({ albumId: id, artistName });
      });
    });
    if (albumArtistRels.length > 0) {
      await tx
        .insert(artists)
        .values([...usedArtists].map((name) => ({ name })))
        .onConflictDoNothing();
      // Delete old album-artist relations if the album just got updated.
      const albumIds = results.map(({ id }) => id);
      await tx
        .delete(albumsToArtists)
        .where(inArray(albumsToArtists.albumId, albumIds));
      await tx.insert(albumsToArtists).values(albumArtistRels);
    }

    return results;
  });
}
//#endregion
