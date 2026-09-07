// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { and, getTableColumns, gte, inArray, lt, sql } from "drizzle-orm";

import { db } from "~/db";
import { lyrics, tracksPlayEvents } from "~/db/schema";

import { preferenceStore } from "~/stores/Preference/store";

import { pickKeys } from "~/utils/object";
import { generateRecapRange } from "./generateRecapRange";

/*
  Optimizes our database by:
    1. Deleting unlinked lyrics.
    2. Collapsing `tracksPlayEvents` into a single entry for duplicate tracks per-month.
*/
export async function optimizeDB() {
  //? 1. Identify and delete any lyrics that are not linked to any tracks.
  const allLyrics = await db.query.lyrics.findMany({
    columns: { id: true },
    with: { tracksToLyrics: { columns: { lyricId: true }, limit: 1 } },
  });
  const unusedLyricIds = allLyrics
    .filter(({ tracksToLyrics }) => tracksToLyrics.length === 0)
    .map(({ id }) => id);
  await db.delete(lyrics).where(inArray(lyrics.id, unusedLyricIds));

  //? 2. Collapse `trackPlayEvents` of each track in each month into a single entry.
  const monthEpoches = generateRecapRange(
    preferenceStore.getState().optimizeInsightsFrom,
  )
    .reverse()
    .map(({ date }) => date.getTime());

  for (const [index, monthEpoch] of monthEpoches.entries()) {
    const limit = monthEpoches.at(index + 1);
    const rangeCond = and(
      gte(tracksPlayEvents.playedAt, monthEpoch),
      limit !== undefined ? lt(tracksPlayEvents.playedAt, limit) : undefined,
    );

    // Aggregate all play events for each track in the month into a single entry.
    const rawAggregatedEvents = await db
      .select({
        ...pickKeys(getTableColumns(tracksPlayEvents), ["trackId"]),
        //? Derive aggregated play time for track.
        playTime: sql`sum(${tracksPlayEvents.playTime})`
          .mapWith(Number)
          .as("agg_play_time"),
      })
      .from(tracksPlayEvents)
      .where(rangeCond)
      .groupBy(tracksPlayEvents.trackId);
    const updatedEvents = rawAggregatedEvents.map(({ trackId, playTime }) => {
      return { trackId, playedAt: monthEpoch, playTime };
    });

    if (updatedEvents.length > 0) {
      // Delete all entries in the current month and insert our aggregated
      // entries.
      await db.transaction(async (tx) => {
        await tx.delete(tracksPlayEvents).where(rangeCond);
        await tx.insert(tracksPlayEvents).values(updatedEvents);
      });
    }

    preferenceStore.setState({ optimizeInsightsFrom: monthEpoch });
  }
}
