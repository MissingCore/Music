// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { desc, eq, getTableColumns, sql } from "drizzle-orm";

import { db } from "~/db";
import { albums, albumsToArtists, tracks } from "~/db/schema";

export const albumsView = db
  .select({
    ...getTableColumns(albums),
    artists: sql<
      string[] | null
    >`NULLIF(json_group_array(${albumsToArtists.artistName}), '[null]')`
      .mapWith((val) => (val !== null ? JSON.parse(val) : null))
      .as("track_artists"),
    minYear: sql<number>`coalesce(min(${tracks.year}), -1)`.as("min_year"),
    maxYear: sql<number>`coalesce(max(${tracks.year}), -1)`.as("max_year"),
    numTracks: sql<number>`coalesce(count(${tracks}), 0)`.as("num_tracks"),
  })
  .from(albums)
  .innerJoin(albumsToArtists, eq(albums.id, albumsToArtists.albumId))
  .innerJoin(tracks, eq(albums.id, tracks.albumId))
  .groupBy(albums.id)
  .orderBy(
    desc(sql<number>`coalesce(max(${tracks.year}), -1)`),
    sql<number>`coalesce(min(${tracks.year}), -1)`,
  )
  .as("albums_view");
