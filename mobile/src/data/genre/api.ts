import { count, eq, getTableColumns, sql, sum } from "drizzle-orm";

import { db } from "~/db";
import {
  albums,
  genres,
  tracks,
  tracksToArtists,
  tracksToGenres,
} from "~/db/schema";

import { iAsc, throwIfNoResults } from "~/lib/drizzle";
import type { GenreTrack } from "./types";
import { unencodeJSONArray } from "../utils";

type InsertedGenre = typeof genres.$inferInsert;

//#region GET Methods
/** Get all data associated with a genre. */
export async function getGenre<TOnlyIds extends boolean = false>(
  id: string,
  onlyIds?: TOnlyIds,
) {
  const [genreDetails, genreTracks] = await Promise.all([
    throwIfNoResults(
      db.query.genres.findFirst({ where: eq(genres.name, id) }),
      "err.msg.noGenres",
    ),
    getGenreTracks(id, onlyIds),
  ]);

  return { ...genreDetails, tracks: genreTracks };
}

/**
 * Return the tracks associated with a genre. It's not guaranteed that
 * the genre exists.
 */
export async function getGenreTracks<TOnlyIds extends boolean = false>(
  id: string,
  onlyIds?: TOnlyIds,
) {
  //? Subquery to order the artist names associated with a track.
  const orderedTrackArtists = db
    .select(getTableColumns(tracksToArtists))
    .from(tracksToArtists)
    .orderBy(iAsc(tracksToArtists.artistName))
    .as("ordered_track_artists");

  const results = await db
    .select(
      onlyIds
        ? { id: tracks.id }
        : {
            id: tracks.id,
            name: tracks.name,
            artwork: sql<
              string | null
            >`coalesce(${tracks.artwork}, ${albums.artwork})`.as(
              "derived_artwork",
            ),
            duration: tracks.duration,
            album: albums.name,
            /** We need to unencode these fields. */
            artists: sql<string>`json_group_array(${orderedTrackArtists.artistName})`,
          },
    )
    .from(tracksToGenres)
    .where(eq(tracksToGenres.genreName, id))
    .innerJoin(tracks, eq(tracksToGenres.trackId, tracks.id))
    .leftJoin(albums, eq(tracks.albumId, albums.id))
    .leftJoin(orderedTrackArtists, eq(tracks.id, orderedTrackArtists.trackId))
    .groupBy(tracksToGenres.trackId)
    .orderBy(iAsc(tracks.name));

  return (
    onlyIds
      ? results
      : results.map(({ artists, ...rest }) => ({
          ...rest,
          artists: unencodeJSONArray(artists as string),
        }))
  ) as TOnlyIds extends true ? Array<{ id: string }> : GenreTrack[];
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
    .filter(({ trackCount }) => trackCount > 0)
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
