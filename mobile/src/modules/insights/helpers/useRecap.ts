// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useQuery } from "@tanstack/react-query";
import {
  and,
  countDistinct,
  desc,
  eq,
  getTableColumns,
  gte,
  lt,
  sql,
} from "drizzle-orm";

import { db } from "~/db";
import {
  albums,
  artists,
  tracks,
  tracksPlayEvents,
  tracksToArtists,
} from "~/db/schema";

import { omitKeys } from "~/utils/object";

async function getRecap(startEpoch: number, endEpoch = Date.now()) {
  //? Identify range of data we care about.
  const scopedPlayEventView = db
    .select({
      ...omitKeys(getTableColumns(tracksPlayEvents), ["playTime"]),
      ...omitKeys(getTableColumns(tracks), ["id"]),
      //? Derive `playCount` from "completion ratio" for best representation based on
      //? track duration and play time.
      playCount:
        sql`ceil(sum(${tracksPlayEvents.playTime}) / ${tracks.duration})`
          .mapWith(Number)
          .as("play_count"),
      //? Derive aggregated play time for track.
      playTime: sql`sum(${tracksPlayEvents.playTime})`
        .mapWith(Number)
        .as("agg_play_time"),
    })
    .from(tracksPlayEvents)
    .where(
      and(
        gte(tracksPlayEvents.playedAt, startEpoch),
        lt(tracksPlayEvents.playedAt, endEpoch),
      ),
    )
    .innerJoin(tracks, eq(tracksPlayEvents.trackId, tracks.id))
    .groupBy(tracksPlayEvents.trackId)
    .as("scoped_play_events");

  //? Get "Overview" stats.
  const [overviewStats] = await db
    .select({
      totalListeningTime: sql`sum(${scopedPlayEventView.playTime})`.mapWith(
        Number,
      ),
      totalPlays:
        sql`coalesce(sum(${scopedPlayEventView.playCount}), 0)`.mapWith(Number),
      uniqueTracks: countDistinct(scopedPlayEventView.trackId),
    })
    .from(scopedPlayEventView);
  const [uniqueArtistsStat] = await db
    .select({
      uniqueArtists: countDistinct(tracksToArtists.artistName),
    })
    .from(scopedPlayEventView)
    .innerJoin(
      tracksToArtists,
      eq(scopedPlayEventView.trackId, tracksToArtists.trackId),
    );

  //? Get "Top Tracks" stats.
  const topTracks = await db
    .select({
      name: scopedPlayEventView.name,
      imgSrc: sql<
        string | null
      >`coalesce(${scopedPlayEventView.artwork}, ${albums.artwork})`,
      playCount: scopedPlayEventView.playCount,
      totalTime: scopedPlayEventView.playTime,
    })
    .from(scopedPlayEventView)
    .leftJoin(albums, eq(scopedPlayEventView.albumId, albums.id))
    .orderBy(
      desc(scopedPlayEventView.playCount),
      desc(scopedPlayEventView.playTime),
    );

  //? Get "Top Artists" stats.
  const topArtists = await db
    .select({
      name: artists.name,
      imgSrc: artists.artwork,
      playCount: sql`sum(${scopedPlayEventView.playCount})`.mapWith(Number),
      totalTime: sql`sum(${scopedPlayEventView.playTime})`.mapWith(Number),
    })
    .from(scopedPlayEventView)
    .innerJoin(
      tracksToArtists,
      eq(scopedPlayEventView.trackId, tracksToArtists.trackId),
    )
    .innerJoin(artists, eq(tracksToArtists.artistName, artists.name))
    .groupBy(artists.name)
    .orderBy(
      desc(sql`sum(${scopedPlayEventView.playCount})`),
      desc(sql`sum(${scopedPlayEventView.playTime})`),
    );

  //? Get "Top Albums" stats.
  const topAlbums = await db
    .select({
      name: albums.name,
      imgSrc: albums.artwork,
      playCount: sql`sum(${scopedPlayEventView.playCount})`.mapWith(Number),
      totalTime: sql`sum(${scopedPlayEventView.playTime})`.mapWith(Number),
    })
    .from(scopedPlayEventView)
    .innerJoin(albums, eq(scopedPlayEventView.albumId, albums.id))
    .groupBy(albums.id)
    .orderBy(
      desc(sql`sum(${scopedPlayEventView.playCount})`),
      desc(sql`sum(${scopedPlayEventView.playTime})`),
    );

  return {
    overview: { ...overviewStats!, ...uniqueArtistsStat! },
    mostPlayed: {
      album: topAlbums[0],
      artist: topArtists[0],
      track: topTracks[0],
    },
    topTracks,
    topArtists,
    topAlbums,
  };
}

export type RecapResult = Awaited<ReturnType<typeof getRecap>>;

const queryKey = ["insights", "recap"];

export function useRecap(startEpoch: number, endEpoch?: number) {
  return useQuery({
    queryKey: [...queryKey, { startEpoch, endEpoch }],
    queryFn: () => getRecap(startEpoch, endEpoch),
  });
}
