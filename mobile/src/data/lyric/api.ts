import { count, eq, getTableColumns } from "drizzle-orm";

import { db } from "~/db";
import { lyrics, tracks, tracksToLyrics } from "~/db/schema";

import { iAsc, throwIfNoResults } from "~/lib/drizzle";
import type { CommonTrack } from "../types";
import { commonTracksOrIds } from "../utils";
import { commonTrackColumns, structuredTracksView } from "../views";

type InsertedLyric = typeof lyrics.$inferInsert;

//#region GET Methods
/** Get all data associated with a lyric. */
export async function getLyric(id: string) {
  const [lyricDetails, lyricTracks] = await Promise.all([
    throwIfNoResults(db.query.lyrics.findFirst({ where: eq(lyrics.id, id) })),
    getLyricTracks(id),
  ]);

  return { ...lyricDetails, tracks: lyricTracks };
}

/**
 * Return the tracks associated with a lyric. It's not guaranteed that
 * the lyric exists.
 */
export async function getLyricTracks(id: string) {
  const results = await db
    .select(commonTrackColumns)
    .from(tracksToLyrics)
    .where(eq(tracksToLyrics.lyricId, id))
    .innerJoin(
      structuredTracksView,
      eq(tracksToLyrics.trackId, structuredTracksView.id),
    )
    .orderBy(iAsc(structuredTracksView.name));

  return commonTracksOrIds<CommonTrack>(results, false);
}

/** Get information summarizing each lyric (sorted by names). */
export async function getLyricsSummary() {
  const results = await db
    .select({
      ...getTableColumns(lyrics),
      trackCount: count(tracks.id),
    })
    .from(lyrics)
    //? We use `leftJoin` instead of `innerJoin` as we want lyrics with no track relations.
    .leftJoin(tracksToLyrics, eq(lyrics.id, tracksToLyrics.lyricId))
    .leftJoin(tracks, eq(tracksToLyrics.trackId, tracks.id))
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
