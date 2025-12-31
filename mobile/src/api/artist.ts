import { and, eq } from "drizzle-orm";

import { db } from "~/db";
import type { Artist } from "~/db/schema";
import { artists } from "~/db/schema";
import { getYearRange } from "~/db/utils";

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
  if (!artist) throw new Error(i18next.t("err.msg.noArtists"));
  return artist;
};

/** Get specified artist. Throws error if nothing is found. */
export const getArtist = _getArtist();

/** Get the albums an artist has released in descending order. */
export async function getArtistAlbums(id: string) {
  const allAlbums = await db.query.albums.findMany({
    where: (fields, { eq }) => eq(fields.artistName, id),
    with: { tracks: { columns: { year: true } } },
  });
  const albumWithYear = allAlbums
    .filter(({ tracks }) => tracks.length > 0)
    .map(({ tracks, ...album }) => ({ ...album, year: getYearRange(tracks) }));
  // FIXME: Once Hermes supports `toSorted`, use it instead.
  albumWithYear.sort(
    (a, b) =>
      b.year.maxYear - a.year.maxYear || b.year.minYear - a.year.minYear,
  );
  return albumWithYear.map(({ year, ...album }) => {
    return { ...album, releaseYear: year.range };
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
/** Create new artist entries. */
export async function createArtists(
  entries: Array<typeof artists.$inferInsert>,
) {
  return db.insert(artists).values(entries).onConflictDoNothing();
}
//#endregion

//#region PATCH Methods
/** Update specified artist. */
export async function updateArtist(
  id: string,
  values: Partial<Omit<typeof artists.$inferInsert, "name">>,
) {
  return db.update(artists).set(values).where(eq(artists.name, id));
}
//#endregion
