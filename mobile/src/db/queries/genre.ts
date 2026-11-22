// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { and, asc, desc, eq, isNotNull, or, sql } from "drizzle-orm";

import { db } from "..";
import { albums, genres, tracks, tracksToGenres } from "../schema";

/** Genre query which has `artwork` fallback to the latest track. */
export function getGenresWithArtwork() {
  return db
    .select({
      name: genres.name,
      artwork: sql<
        string | null
      >`coalesce(${genres.artwork}, ${latestTrackArtwork})`,
    })
    .from(genres);
}

const latestTrackArtwork = db
  .select({
    artwork: sql<string | null>`coalesce(${tracks.artwork}, ${albums.artwork})`,
  })
  .from(tracksToGenres)
  .innerJoin(tracks, eq(tracksToGenres.trackId, tracks.id))
  .leftJoin(albums, eq(tracks.albumId, albums.id))
  .where(
    and(
      eq(tracksToGenres.genreName, genres.name),
      or(isNotNull(tracks.artwork), isNotNull(albums.artwork)),
    ),
  )
  .orderBy(desc(tracks.year), desc(tracks.modificationTime), asc(tracks.name))
  .limit(1);
