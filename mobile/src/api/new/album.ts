import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { albums } from "@/db/schema";

import i18next from "@/modules/i18n";

import type {
  DrizzleFilter,
  FavoriteArgs,
  QueryMultiple,
  QuerySingle,
} from "./types";

//#region GET Methods
/** Get the specified album. Throws error by default if no album is found. */
export async function getAlbum({ shouldThrow = true, ...opts }: QuerySingle) {
  let filters: DrizzleFilter = opts.filters ?? [];
  if (opts.id) filters.push(eq(albums.id, opts.id));
  const album = await db.query.albums.findFirst({
    where: and(...filters),
    with: { tracks: true },
  });
  if (shouldThrow && !album) throw new Error(i18next.t("response.noAlbums"));
  return album;
}

/** Get multiple albums. */
export async function getAlbums(args?: QueryMultiple) {
  return db.query.albums.findMany({
    where: and(...(args?.filters ?? [])),
    with: { tracks: true },
  });
}
//#endregion

//#region PATCH Methods
/** Update the `favorite` status of an album. */
export async function favoriteAlbum({ id, isFavorite }: FavoriteArgs) {
  await db.update(albums).set({ isFavorite }).where(eq(albums.id, id));
}
//#endregion

//#region PUT Methods
/** Create a new album entry, or update an existing one. Returns the created album. */
export async function upsertAlbum(albumEntry: typeof albums.$inferInsert) {
  return (
    await db
      .insert(albums)
      .values(albumEntry)
      .onConflictDoUpdate({
        target: [albums.name, albums.artistName, albums.releaseYear],
        set: albumEntry,
      })
      .returning()
  )[0];
}
//#endregion
