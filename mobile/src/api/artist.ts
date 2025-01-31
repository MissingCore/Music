import { and, eq } from "drizzle-orm";

import { db } from "~/db";
import type { Artist } from "~/db/schema";
import { artists } from "~/db/schema";

import i18next from "~/modules/i18n";

import { iAsc } from "~/lib/drizzle";
import type { QueryManyWithTracksFn, QueryOneWithTracksFn } from "./types";
import { getColumns, withTracks } from "./utils";

//#region GET Methods
const _getArtist: QueryOneWithTracksFn<Artist> = () => async (id, options) => {
  const artist = await db.query.artists.findFirst({
    where: eq(artists.name, id),
    columns: getColumns(options?.columns),
    with: withTracks(
      { ...options, orderBy: (fields) => iAsc(fields.name) },
      { defaultWithAlbum: true, ...options },
    ),
  });
  if (!artist) throw new Error(i18next.t("response.noArtists"));
  return artist;
};

/** Get specified artist. Throws error if nothing is found. */
export const getArtist = _getArtist();

/** Get the albums an artist has released in descending order. */
export async function getArtistAlbums(id: string) {
  return db.query.albums.findMany({
    where: (fields, { eq }) => eq(fields.artistName, id),
    orderBy: (fields, { desc }) => desc(fields.releaseYear),
  });
}

const _getArtists: QueryManyWithTracksFn<Artist> = () => async (options) => {
  return db.query.artists.findMany({
    where: and(...(options?.where ?? [])),
    columns: getColumns(options?.columns),
    with: withTracks(
      { ...options, orderBy: (fields) => iAsc(fields.name) },
      { defaultWithAlbum: true, ...options },
    ),
    orderBy: (fields) => iAsc(fields.name),
  });
};

/** Get multiple artists. */
export const getArtists = _getArtists();
//#endregion

//#region POST Methods
/** Create a new artist entry. */
export async function createArtist(entry: typeof artists.$inferInsert) {
  return db.insert(artists).values(entry).onConflictDoNothing();
}
//#endregion

//#region PATCH Methods
/** Update specified artist. */
export async function updateArtist(
  id: string,
  values: Partial<typeof artists.$inferInsert>,
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { name: _, ...rest } = values;
  return db.update(artists).set(rest).where(eq(artists.name, id));
}
//#endregion
