import { count, eq, getTableColumns, sum } from "drizzle-orm";

import { db } from "~/db";
import { genres, tracks, tracksToGenres } from "~/db/schema";

import { iAsc, throwIfNoResults } from "~/lib/drizzle";
import { formatSeconds } from "~/utils/number";
import type { CommonTrack, TracksSortOptions } from "../types";
import { commonTracksOrIds, getTracksOrderedBy } from "../utils";
import { commonTrackColumns, structuredTracksView } from "../views";

type InsertedGenre = typeof genres.$inferInsert;

//#region GET Methods
/** Get all data associated with a genre. */
export async function getGenre<TOnlyIds extends boolean | undefined = false>(
  id: string,
  onlyIds?: TOnlyIds,
  sortOptions?: TracksSortOptions<"genreTracks">,
) {
  const [genreDetails, genreTracks] = await Promise.all([
    getGenreDetails(id),
    getGenreTracks(id, onlyIds, sortOptions),
  ]);

  return { ...genreDetails, tracks: genreTracks };
}

export async function getGenreDetails(id: string) {
  const [details, [agg]] = await Promise.all([
    throwIfNoResults(
      db.query.genres.findFirst({ where: eq(genres.name, id) }),
      "err.msg.noGenres",
    ),
    db
      .select({ duration: sum(tracks.duration) })
      .from(tracksToGenres)
      .where(eq(tracksToGenres.genreName, id))
      .innerJoin(tracks, eq(tracksToGenres.trackId, tracks.id)),
  ]);

  return {
    ...details,
    duration: formatSeconds(agg?.duration ? +agg.duration : 0),
  };
}

/**
 * Return the tracks associated with a genre. It's not guaranteed that
 * the genre exists.
 */
export async function getGenreTracks<
  TOnlyIds extends boolean | undefined = false,
>(
  id: string,
  onlyIds?: TOnlyIds,
  sortOptions?: TracksSortOptions<"genreTracks">,
) {
  const results = await db
    .select(onlyIds ? { id: structuredTracksView.id } : commonTrackColumns)
    .from(tracksToGenres)
    .where(eq(tracksToGenres.genreName, id))
    .innerJoin(
      structuredTracksView,
      eq(tracksToGenres.trackId, structuredTracksView.id),
    )
    .orderBy(getTracksOrderedBy("genreTracks", sortOptions));

  return commonTracksOrIds<CommonTrack, TOnlyIds>(results, onlyIds);
}

/** Get information summarizing each genre (sorted by names). */
export async function getGenresSummary() {
  const results = await db
    .select({
      ...getTableColumns(genres),
      duration: sum(tracks.duration),
      trackCount: count(tracks.id),
    })
    .from(genres)
    .innerJoin(tracksToGenres, eq(genres.name, tracksToGenres.genreName))
    .innerJoin(tracks, eq(tracksToGenres.trackId, tracks.id))
    .groupBy(genres.name)
    .orderBy(iAsc(genres.name));

  return results
    .map((genre) => ({ ...genre, duration: Number(genre.duration) || 0 }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
//#endregion

//#region POST Methods
export async function createGenres(entries: InsertedGenre[]) {
  return db.insert(genres).values(entries).onConflictDoNothing();
}
//#endregion

//#region PATCH Methods
export async function updateGenre(
  id: string,
  values: Partial<Omit<InsertedGenre, "name">>,
) {
  return db.update(genres).set(values).where(eq(genres.name, id));
}
//#endregion
