import { and, eq } from "drizzle-orm";

import { db } from "~/db";
import type { Artist } from "~/db/schema";
import { artists } from "~/db/schema";
import { getYearRange } from "~/db/utils";

import { iAsc } from "~/lib/drizzle";
import type { QueryManyWithTracksFn } from "./types";
import { getColumns, withTracks } from "./utils";

//#region GET Methods
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
