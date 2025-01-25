import { and, eq } from "drizzle-orm";

import { db } from "~/db";
import type { Album, AlbumWithTracks, Track } from "~/db/schema";
import { albums } from "~/db/schema";

import i18next from "~/modules/i18n";

import { iAsc } from "~/lib/drizzle";
import type { DrizzleFilter } from "./types";
import type {
  QueryManyWithTracksResult,
  QueryOneWithTracksResult,
} from "./utils";
import { getColumns } from "./utils";

//#region GET Methods
/** Get specified album. Throws error if nothing is found. */
export async function getAlbum<
  DCols extends keyof Album,
  TCols extends keyof Track,
>(id: string, options?: { columns?: DCols[]; trackColumns?: TCols[] }) {
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
  return album as QueryOneWithTracksResult<AlbumWithTracks, DCols, TCols>;
}

/** Get multiple albums. */
export async function getAlbums<
  DCols extends keyof Album,
  TCols extends keyof Track,
>(options?: {
  where?: DrizzleFilter;
  columns?: DCols[];
  trackColumns?: TCols[];
}) {
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
  }) as Promise<QueryManyWithTracksResult<AlbumWithTracks, DCols, TCols>>;
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
