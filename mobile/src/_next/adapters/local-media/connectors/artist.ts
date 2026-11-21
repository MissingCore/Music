// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  notExists,
  or,
  sql,
} from "drizzle-orm";

import { db } from "~/db";
import {
  albums,
  albumsToArtists,
  artists,
  genres,
  tracks,
  tracksPlayEvents,
  tracksToArtists,
  tracksToGenres,
} from "~/db/schema";
import { getArtistsWithArtwork } from "~/db/queries/artist";

import { throwIfNoResults } from "~/_next/utils/drizzle";
import type { Connector, MediaItem } from "../../types";

export const LocalMediaArtistConnector = {
  async get(id) {
    //? 1. Get basic stored artist details. Throws an error if the artist doesn't exist.
    const [artist] = await throwIfNoResults(
      getArtistsWithArtwork().where(eq(artists.name, id)).limit(1),
      "err.msg.noArtists",
    );

    //? 2. Get aggregated data related to its tracks. It's faster to do this rather than
    //? deriving `totalDuration` from reducing `artistTopTracks`.
    const [agg] = await throwIfNoResults(
      db
        .select({
          numTracks: count(tracks.id),
          totalDuration: sql`coalesce(sum(${tracks.duration}), 0)`.mapWith(
            Number,
          ),
        })
        .from(tracksToArtists)
        .where(eq(tracksToArtists.artistName, id))
        .innerJoin(tracks, eq(tracksToArtists.trackId, tracks.id)),
    );

    //? 3. Get tracks, sorted by how many times we played them.
    const artistTopTracks = await db
      .select({
        id: tracks.id,
        name: tracks.name,
        album: albums.name,
        artwork: sql<
          string | null
        >`coalesce(${tracks.artwork}, ${albums.artwork})`,
      })
      .from(tracksToArtists)
      .where(eq(tracksToArtists.artistName, id))
      .innerJoin(tracks, eq(tracksToArtists.trackId, tracks.id))
      .leftJoin(albums, eq(tracks.albumId, albums.id))
      .leftJoin(tracksPlayEvents, eq(tracks.id, tracksPlayEvents.trackId))
      .groupBy(tracksToArtists.trackId)
      .orderBy(
        sql`coalesce(ceil(sum(${tracksPlayEvents.playTime}) / ${tracks.duration}), 0) DESC`,
        asc(tracks.name),
      );

    //? 4. Get albums, EPs, and albums containing singles.
    const artistAlbums = await db
      .select({
        id: albums.id,
        name: albums.name,
        artwork: albums.artwork,
        isEP: albums.isEP,
        minYear: sql<number>`coalesce(min(${tracks.year}), -1)`,
        maxYear: sql<number>`coalesce(max(${tracks.year}), -1)`,
        numTracks: sql<number>`coalesce(count(${tracks.id}), 0)`,
      })
      .from(albumsToArtists)
      .where(eq(albumsToArtists.artistName, id))
      .innerJoin(albums, eq(albumsToArtists.albumId, albums.id))
      .innerJoin(tracks, eq(albums.id, tracks.albumId))
      .groupBy(albums.id)
      .orderBy(
        desc(sql<number>`coalesce(max(${tracks.year}), -1)`),
        desc(sql<number>`coalesce(min(${tracks.year}), -1)`),
        //? It's not that common for an artist to release multiple albums in the same
        //? year. If they do, we assume they're variants and thus similarily named.
        desc(albums.name),
      );

    const { singleAlbums, ...categorizedAlbums } = artistAlbums.reduce<{
      albums: MediaItem.DisplayAlbum[];
      eps: MediaItem.DisplayAlbum[];
      singleAlbums: MediaItem.DisplayAlbum[];
    }>(
      (prev, { isEP, minYear, maxYear, numTracks, ...album }) => {
        const formattedEntry = {
          ...album,
          year: formatYearRange(minYear, maxYear),
        };

        if (isEP) prev.eps.push(formattedEntry);
        else if (numTracks > 1) prev.albums.push(formattedEntry);
        else prev.singleAlbums.push(formattedEntry);

        return prev;
      },
      { albums: [], eps: [], singleAlbums: [] },
    );

    const singleAlbumIds = singleAlbums.map(({ id }) => id);

    //? 5. Get tracks with no albums, tracks in albums with a single track, and tracks in albums not by this artist.
    const artistSingles = await db
      .select({
        id: tracks.id,
        name: tracks.name,
        album: albums.name,
        artwork: sql<
          string | null
        >`coalesce(${tracks.artwork}, ${albums.artwork})`,
      })
      .from(tracksToArtists)
      .innerJoin(tracks, eq(tracksToArtists.trackId, tracks.id))
      .leftJoin(albums, eq(tracks.albumId, albums.id))
      .orderBy(
        desc(tracks.year),
        desc(tracks.modificationTime),
        asc(tracks.name),
      )
      .where(
        and(
          eq(tracksToArtists.artistName, id),
          or(
            singleAlbumIds.length > 0
              ? inArray(tracks.albumId, singleAlbumIds)
              : undefined,
            //* Handles tracks with no albums & tracks in albums not by this artist.
            notExists(
              db
                .select()
                .from(albumsToArtists)
                .where(
                  and(
                    eq(albumsToArtists.albumId, tracks.albumId),
                    eq(albumsToArtists.artistName, id),
                  ),
                ),
            ),
          ),
        ),
      );

    //? 6. Get albums that the artist has also appeared on.
    const albumAppearances = await db
      .select({
        id: albums.id,
        name: albums.name,
        artwork: albums.artwork,
        minYear: sql<number>`coalesce(min(${tracks.year}), -1)`,
        maxYear: sql<number>`coalesce(max(${tracks.year}), -1)`,
      })
      .from(tracksToArtists)
      .innerJoin(tracks, eq(tracksToArtists.trackId, tracks.id))
      .innerJoin(albums, eq(tracks.albumId, albums.id))
      .where(
        and(
          eq(tracksToArtists.artistName, id),
          notExists(
            db
              .select()
              .from(albumsToArtists)
              .where(
                and(
                  eq(albumsToArtists.albumId, albums.id),
                  eq(albumsToArtists.artistName, id),
                ),
              ),
          ),
        ),
      )
      .groupBy(albums.id)
      .orderBy(
        desc(sql<number>`coalesce(max(${tracks.year}), -1)`),
        desc(sql<number>`coalesce(min(${tracks.year}), -1)`),
        desc(albums.name),
      )
      .then((results) =>
        results.map(({ minYear, maxYear, ...album }) => ({
          ...album,
          year: formatYearRange(minYear, maxYear),
        })),
      );

    //? 7. Get the genres the artist has released music for.
    const artistGenres = await db
      .select({ name: genres.name })
      .from(tracksToArtists)
      .innerJoin(
        tracksToGenres,
        eq(tracksToArtists.trackId, tracksToGenres.trackId),
      )
      .innerJoin(genres, eq(tracksToGenres.genreName, genres.name))
      .where(eq(tracksToArtists.artistName, id))
      .groupBy(genres.name)
      .orderBy(asc(genres.name));

    return {
      name: artist.name,
      artwork: artist.artwork,
      ...agg,
      topTracks: artistTopTracks,
      discography: {
        ...categorizedAlbums,
        singles: artistSingles,
      },
      related: {
        albums: albumAppearances,
        genres: artistGenres.map(({ name }) => name),
      },
    };
  },

  async getTrackIds(id) {
    return db
      .select({ id: tracksToArtists.trackId })
      .from(tracksToArtists)
      .where(eq(tracksToArtists.artistName, id));
  },
} as const satisfies Connector.Artist & Record<PropertyKey, unknown>;

//#region Internal Utils
function formatYearRange(minYear: number, maxYear: number) {
  if (minYear === -1) return "————";
  if (minYear === maxYear) return `${maxYear}`;
  return `${minYear} - ${maxYear}`;
}
//#endregion
