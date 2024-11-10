import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { albums } from "@/db/schema";

import i18next from "@/modules/i18n";

import type {
  DrizzleFilter,
  FavoriteArgs,
  QueryCondition,
  QueryMultiple,
  QuerySingle,
} from "./types";

//#region GET Methods
/** Get the specified album. Throws error by default if no album is found. */
export async function getAlbum({ shouldThrow = true, ...opts }: QuerySingle) {
  let conditions: DrizzleFilter = opts.filters ?? [];
  if (opts.id) conditions.push(eq(albums.id, opts.id));
  const album = await db.query.albums.findFirst({
    where: and(...conditions),
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
export async function favoriteAlbum({ isFavorite, ...args }: FavoriteArgs) {
  return updateAlbum({ ...args, set: { isFavorite } });
}

/** Update specified album. */
export async function updateAlbum(
  args: QueryCondition & { set: Partial<typeof albums.$inferInsert> },
) {
  let conditions: DrizzleFilter = args.filters ?? [];
  if (args.id) conditions.push(eq(albums.id, args.id));
  return db
    .update(albums)
    .set(args.set)
    .where(and(...conditions));
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

//#region DELETE Methods
/** Delete specified album. */
export async function deleteAlbum(args: QueryCondition) {
  let conditions: DrizzleFilter = args.filters ?? [];
  if (args.id) conditions.push(eq(albums.id, args.id));
  return db.delete(albums).where(and(...conditions));
}
//#endregion
