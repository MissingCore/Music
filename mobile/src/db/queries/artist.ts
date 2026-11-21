// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { and, asc, desc, eq, isNotNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { db } from "..";
import {
  albums,
  albumsToArtists,
  artists,
  tracks,
  tracksToArtists,
} from "../schema";

/**
 * Artist query which has `artwork` fallback to the latest track or random
 * album.
 */
export function getArtistsWithArtwork() {
  return db
    .select({
      name: artists.name,
      artwork: sql<string | null>`
        coalesce(
          ${artists.artwork},
          ${tracks.artwork},
          ${selectedTrackAlbum.artwork},
          ${fallbackAlbum.artwork}
        )
      `,
    })
    .from(artists)
    .leftJoin(tracks, eq(tracks.id, latestTrackId))
    .leftJoin(selectedTrackAlbum, eq(selectedTrackAlbum.id, tracks.albumId))
    .leftJoin(fallbackAlbum, eq(fallbackAlbum.id, fallbackAlbumId));
}

// Aliases are necessary as we're joining 2 different album entries.
const selectedTrackAlbum = alias(albums, "artist_artwork_selected_track_album");
const fallbackAlbum = alias(albums, "artist_artwork_fallback_album");

// Id of most recently released track with artwork (for this artist).
const latestTrackId = db
  .select({ id: tracks.id })
  .from(tracksToArtists)
  .innerJoin(tracks, eq(tracksToArtists.trackId, tracks.id))
  .leftJoin(albums, eq(tracks.albumId, albums.id))
  .where(
    and(
      eq(tracksToArtists.artistName, artists.name),
      or(isNotNull(tracks.artwork), isNotNull(albums.artwork)),
    ),
  )
  .orderBy(desc(tracks.year), desc(tracks.modificationTime), asc(tracks.name))
  .limit(1);

// Id of album with artwork (for this artist).
const fallbackAlbumId = db
  .select({ id: albums.id })
  .from(albumsToArtists)
  .innerJoin(albums, eq(albumsToArtists.albumId, albums.id))
  .where(
    and(
      eq(albumsToArtists.artistName, artists.name),
      isNotNull(albums.artwork),
    ),
  )
  .limit(1);
