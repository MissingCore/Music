import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import type { AlbumWithTracks } from "@/db/schema";
import { albums } from "@/db/schema";

import i18next from "@/modules/i18n";

import { iAsc } from "@/lib/drizzle";
import type { DrizzleFilter, QuerySingleFn } from "./types";

//#region GET Methods
/** Get specified album. Throws error by default if nothing is found. */
// @ts-expect-error - Function overloading typing issues [ts(2322)]
export const getAlbum: QuerySingleFn<AlbumWithTracks> = async (
  id,
  shouldThrow = true,
) => {
  const album = await db.query.albums.findFirst({
    where: eq(albums.id, id),
    with: { tracks: { orderBy: (fields, { asc }) => [asc(fields.track)] } },
  });
  if (shouldThrow && !album) throw new Error(i18next.t("response.noAlbums"));
  return album;
};

/** Get multiple albums. */
export async function getAlbums(where: DrizzleFilter = []) {
  return db.query.albums.findMany({
    where: and(...where),
    with: { tracks: { orderBy: (fields, { asc }) => [asc(fields.track)] } },
    orderBy: (fields) => [iAsc(fields.name), iAsc(fields.artistName)],
  });
}
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
