import { count, eq, getTableColumns, sql } from "drizzle-orm";

import { db } from "~/db";
import { albums, lyrics, tracks, tracksToLyrics } from "~/db/schema";

import { iAsc, throwIfNoResults } from "~/lib/drizzle";
import type { LyricTrack } from "./types";
import { unencodeJSONArray } from "../utils";
import { getOrderedTrackArtistsView } from "../views";

type InsertedLyric = typeof lyrics.$inferInsert;

//#region GET Methods
/** Get all data associated with a lyric. */
export async function getLyric<TOnlyIds extends boolean = false>(
  id: string,
  onlyIds?: TOnlyIds,
) {
  const [lyricDetails, lyricTracks] = await Promise.all([
    throwIfNoResults(db.query.lyrics.findFirst({ where: eq(lyrics.id, id) })),
    getLyricTracks(id, onlyIds),
  ]);

  return { ...lyricDetails, tracks: lyricTracks };
}

/**
 * Return the tracks associated with a lyric. It's not guaranteed that
 * the lyric exists.
 */
export async function getLyricTracks<TOnlyIds extends boolean = false>(
  id: string,
  onlyIds?: TOnlyIds,
) {
  const orderedTrackArtists = getOrderedTrackArtistsView();

  const results = await db
    .select(
      onlyIds
        ? { id: tracks.id }
        : {
            id: tracks.id,
            name: tracks.name,
            album: albums.name,
            /** We need to unencode these fields. */
            artists: sql<string>`json_group_array(${orderedTrackArtists.artistName})`,
          },
    )
    .from(tracksToLyrics)
    .where(eq(tracksToLyrics.lyricId, id))
    .innerJoin(tracks, eq(tracksToLyrics.trackId, tracks.id))
    .leftJoin(albums, eq(tracks.albumId, albums.id))
    .leftJoin(orderedTrackArtists, eq(tracks.id, orderedTrackArtists.trackId))
    .groupBy(tracksToLyrics.trackId)
    .orderBy(iAsc(tracks.name));

  return (
    onlyIds
      ? results
      : results.map(({ artists, ...rest }) => ({
          ...rest,
          artists: unencodeJSONArray(artists as string),
        }))
  ) as TOnlyIds extends true ? Array<{ id: string }> : LyricTrack[];
}

/** Get information summarizing each lyric (sorted by names). */
export async function getLyricsSummary() {
  const results = await db
    .select({
      ...getTableColumns(lyrics),
      trackCount: count(tracks.id),
    })
    .from(lyrics)
    .innerJoin(tracksToLyrics, eq(lyrics.id, tracksToLyrics.lyricId))
    .innerJoin(tracks, eq(tracksToLyrics.trackId, tracks.id))
    .groupBy(lyrics.id)
    .orderBy(iAsc(lyrics.name));

  return results.sort((a, b) => a.name.localeCompare(b.name));
}
//#endregion

//#region POST Methods
/** Returns the created lyric. */
export async function createLyric(entry: InsertedLyric) {
  const [result] = await db.insert(lyrics).values(entry).returning();
  return result;
}
//#endregion

//#region PATCH Methods
export async function updateLyric(
  id: string,
  values: Partial<Omit<InsertedLyric, "id">>,
) {
  return db.update(lyrics).set(values).where(eq(lyrics.id, id));
}
//#endregion

//#region DELETE Methods
export async function deleteLyric(id: string) {
  return db.transaction(async (tx) => {
    await tx.delete(tracksToLyrics).where(eq(tracksToLyrics.lyricId, id));
    await tx.delete(lyrics).where(eq(lyrics.id, id));
  });
}
//#endregion
