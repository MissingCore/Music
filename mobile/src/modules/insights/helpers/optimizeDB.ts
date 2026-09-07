// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  and,
  countDistinct,
  getTableColumns,
  gte,
  inArray,
  lt,
  sql,
} from "drizzle-orm";

import { db } from "~/db";
import { lyrics, tracksPlayEvents } from "~/db/schema";

import { preferenceStore } from "~/stores/Preference/store";

import { queryClient } from "~/lib/react-query";
import { pickKeys } from "~/utils/object";
import { wait } from "~/utils/promise";
import { generateRecapRange } from "./generateRecapRange";

/** Return the number of entries that can be optimized. */
async function countOptimizationTargets() {
  //? 1. Count the number of lyrics that are not linked to any tracks.
  const allLyrics = await db.query.lyrics.findMany({
    columns: { id: true },
    with: { tracksToLyrics: { columns: { lyricId: true }, limit: 1 } },
  });
  const unusedLyricsCount = allLyrics.filter(
    ({ tracksToLyrics }) => tracksToLyrics.length === 0,
  ).length;

  //? 2. Count the number of `trackPlayEvents` that can be collapsed.
  const { optimizeInsightsFrom } = preferenceStore.getState();
  let unneededTracksPlayEvents = await db.$count(
    tracksPlayEvents,
    gte(tracksPlayEvents.playedAt, optimizeInsightsFrom),
  );

  const monthEpoches = generateRecapRange(optimizeInsightsFrom)
    .reverse()
    .map(({ date }) => date.getTime());

  for (const [index, monthEpoch] of monthEpoches.entries()) {
    const limit = monthEpoches.at(index + 1);
    const rangeCond = and(
      gte(tracksPlayEvents.playedAt, monthEpoch),
      limit !== undefined ? lt(tracksPlayEvents.playedAt, limit) : undefined,
    );

    const [uniqueTracksInMonth] = await db
      .select({ uniqueTracks: countDistinct(tracksPlayEvents.trackId) })
      .from(tracksPlayEvents)
      .where(rangeCond);

    if (uniqueTracksInMonth)
      unneededTracksPlayEvents -= uniqueTracksInMonth.uniqueTracks;
  }

  console.log(
    `Found ${unusedLyricsCount} unused lyrics & ${unneededTracksPlayEvents} collapsable tracksPlayEvents.`,
  );

  return unusedLyricsCount + unneededTracksPlayEvents;
}

/*
  Optimizes our database by:
    1. Deleting unlinked lyrics.
    2. Collapsing `tracksPlayEvents` into a single entry for duplicate tracks per-month.
*/
async function optimizeDB() {
  toast.t("feat.dbOptimization.extra.start", { autoDismiss: false });

  try {
    // Slight buffer before we run our code due to the code blocking the
    // JS thread, causing `isPending` to not update immediately, allowing
    // the user to spam the button to rescan the library.
    await wait(1);

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

    toast.t("feat.dbOptimization.extra.success");
  } catch (err) {
    console.log(err);
    toast.tError("err.flow.generic.title");
  } finally {
    queryClient.invalidateQueries({
      predicate: ({ queryKey }) => queryKey[0] === "insights",
    });
  }
}

const queryKey = ["insights", "db-optimization-count"];

export function useOptimizableTargetCount() {
  return useQuery({ queryKey, queryFn: countOptimizationTargets });
}

export const useOptimizeDatabase = () =>
  useMutation({ mutationFn: optimizeDB });
