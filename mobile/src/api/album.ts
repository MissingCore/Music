import { and, eq } from "drizzle-orm";

import { db } from "~/db";
import type { Album } from "~/db/schema";
import { albums } from "~/db/schema";

import i18next from "~/modules/i18n";

import { iAsc } from "~/lib/drizzle";
import type { QueryManyWithTracksFn, QueryOneWithTracksFn } from "./types";
import { getColumns } from "./utils";

//#region GET Methods
const _getAlbum: QueryOneWithTracksFn<Album, false> =
  () => async (id, options) => {
    const album = await db.query.albums.findFirst({
      where: eq(albums.id, id),
      columns: getColumns(options?.columns),
      with: {
        tracks: {
          columns: getColumns(options?.trackColumns),
          orderBy: (fields, { asc }) => [asc(fields.disc), asc(fields.track)],
        },
      },
    });
    if (!album) throw new Error(i18next.t("response.noAlbums"));
    return album;
  };

/** Get specified album. Throws error if nothing is found. */
export const getAlbum = _getAlbum();

const _getAlbums: QueryManyWithTracksFn<Album, false> =
  () => async (options) => {
    return db.query.albums.findMany({
      where: and(...(options?.where ?? [])),
      columns: getColumns(options?.columns),
      with: {
        tracks: {
          columns: getColumns(options?.trackColumns),
          orderBy: (fields, { asc }) => [asc(fields.disc), asc(fields.track)],
        },
      },
      orderBy: (fields) => [iAsc(fields.name), iAsc(fields.artistName)],
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
/** Create a new album entry, or update an existing one. Returns the created album. */
export async function upsertAlbum(entry: typeof albums.$inferInsert) {
  return (
    await db
      .insert(albums)
      .values(entry)
      .onConflictDoUpdate({
        target: [albums.name, albums.artistName, albums.releaseYear],
        set: entry,
      })
      .returning()
  )[0];
}
//#endregion

//#region DELETE Methods
/** Delete specified album. */
export async function deleteAlbum(id: string) {
  return db.delete(albums).where(eq(albums.id, id));
}
//#endregion
