// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { and, countDistinct, getTableColumns, gte, lt, sql } from "drizzle-orm";

import { db } from "~/db";
import { tracksPlayEvents } from "~/db/schema";

import { preferenceStore } from "~/stores/Preference/store";

import { queryClient } from "~/lib/react-query";
import { pickKeys } from "~/utils/object";
import { wait } from "~/utils/promise";
import { generateRecapRange } from "./generateRecapRange";
import { RECENT_RANGE_MS } from "../core/constants";

/** Return the number of entries that can be optimized. */
async function countOptimizationTargets() {
  //? 1. Count the number of `trackPlayEvents` that can be collapsed.
  const { optimizeInsightsFrom } = preferenceStore.getState();
  const recentRangeStart = Date.now() - RECENT_RANGE_MS;
  let unneededTracksPlayEvents = await db.$count(
    tracksPlayEvents,
    and(
      gte(tracksPlayEvents.playedAt, optimizeInsightsFrom),
      lt(tracksPlayEvents.playedAt, recentRangeStart),
    ),
  );

  const monthEpoches = generateRecapRange(optimizeInsightsFrom)
    .reverse()
    .map(({ date }) => date.getTime())
    //? Don't return month if it's after `recentRangeStart`.
    .filter((epoch) => epoch <= recentRangeStart);

  for (const [index, monthEpoch] of monthEpoches.entries()) {
    const limit = monthEpoches.at(index + 1);
    const rangeCond = and(
      gte(tracksPlayEvents.playedAt, monthEpoch),
      lt(
        tracksPlayEvents.playedAt,
        //? Up to the next month or our hard-cap of collapsing data.
        limit ?? recentRangeStart,
      ),
    );

    const [uniqueTracksInMonth] = await db
      .select({ uniqueTracks: countDistinct(tracksPlayEvents.trackId) })
      .from(tracksPlayEvents)
      .where(rangeCond);

    if (uniqueTracksInMonth)
      unneededTracksPlayEvents -= uniqueTracksInMonth.uniqueTracks;
  }

  console.log(
    `Found ${unneededTracksPlayEvents} collapsable tracksPlayEvents.`,
  );

  return unneededTracksPlayEvents;
}

/*
  Optimizes our database by:
    1. Collapsing `tracksPlayEvents` into a single entry for duplicate tracks per-month.
*/
async function optimizeDB() {
  toast.t("feat.dbOptimization.extra.start", { autoDismiss: false });

  try {
    // Slight buffer before we run our code due to the code blocking the
    // JS thread, causing `isPending` to not update immediately, allowing
    // the user to spam the button to rescan the library.
    await wait(1);

    //? 1. Collapse `trackPlayEvents` of each track in each month into a single entry.
    const recentRangeStart = Date.now() - RECENT_RANGE_MS;
    const monthEpoches = generateRecapRange(
      preferenceStore.getState().optimizeInsightsFrom,
    )
      .reverse()
      .map(({ date }) => date.getTime())
      //? Don't return month if it's after `recentRangeStart`.
      .filter((epoch) => epoch <= recentRangeStart);

    for (const [index, monthEpoch] of monthEpoches.entries()) {
      const limit = monthEpoches.at(index + 1);
      const rangeCond = and(
        gte(tracksPlayEvents.playedAt, monthEpoch),
        lt(
          tracksPlayEvents.playedAt,
          //? Up to the next month or our hard-cap of collapsing data.
          limit ?? recentRangeStart,
        ),
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
