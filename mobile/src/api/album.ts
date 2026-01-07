import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "~/db";
import type { Album } from "~/db/schema";
import { albums, albumsToArtists, artists } from "~/db/schema";
import { getArtistsFromArtistsKey } from "~/db/utils";

import i18next from "~/modules/i18n";

import { iAsc } from "~/lib/drizzle";
import type { QueryManyWithTracksFn, QueryOneWithTracksFn } from "./types";
import { getColumns, withTracks } from "./utils";

//#region GET Methods
const _getAlbum: QueryOneWithTracksFn<Album, false> =
  () => async (id, options) => {
    const album = await db.query.albums.findFirst({
      where: eq(albums.id, id),
      columns: getColumns(options?.columns),
      with: withTracks(
        {
          ...options,
          orderBy: (fields, { asc }) => [asc(fields.disc), asc(fields.track)],
        },
        { defaultWithAlbum: false, ...options },
      ),
    });
    if (!album) throw new Error(i18next.t("err.msg.noAlbums"));
    return album;
  };

/** Get specified album. Throws error if nothing is found. */
export const getAlbum = _getAlbum();

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
      getArtistsFromArtistsKey(artistsKey).forEach((artistName) => {
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
