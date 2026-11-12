// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { count, eq, getTableColumns, sum } from "drizzle-orm";

import { db } from "~/db";
import { artists, tracks, tracksToArtists } from "~/db/schema";

import { iAsc } from "~/lib/drizzle";

type InsertedArtist = typeof artists.$inferInsert;

//#region GET Methods
/** Get information summarizing each artist (sorted by names). */
export async function getArtistsSummary() {
  const results = await db
    .select({
      ...getTableColumns(artists),
      duration: sum(tracks.duration),
      trackCount: count(tracks.id),
    })
    .from(artists)
    .innerJoin(tracksToArtists, eq(artists.name, tracksToArtists.artistName))
    .innerJoin(tracks, eq(tracksToArtists.trackId, tracks.id))
    .groupBy(artists.name)
    .orderBy(iAsc(artists.name));

  return results
    .map((artist) => ({ ...artist, duration: Number(artist.duration) || 0 }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
//#endregion

//#region POST Methods
export async function createArtists(entries: InsertedArtist[]) {
  return db.insert(artists).values(entries).onConflictDoNothing();
}
//#endregion

//#region PATCH Methods
export async function updateArtist(
  id: string,
  values: Partial<Omit<InsertedArtist, "name">>,
) {
  return db.update(artists).set(values).where(eq(artists.name, id));
}
//#endregion
