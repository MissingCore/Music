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
  tracks,
  tracksPlayEvents,
  tracksToArtists,
} from "~/db/schema";

import { throwIfNoResults } from "~/lib/drizzle";
import type { Adapter, Connector, MediaDetails } from "../types";

const LocalMediaArtistConnector = {
  async get(id) {
    //? 1. Get basic stored artist details. Throws an error if the artist doesn't exist.
    const artist = await throwIfNoResults(
      db.query.artists.findFirst({ where: eq(artists.name, id) }),
      "err.msg.noArtists",
    );

    //? 2. Get aggregated data related to its tracks. It's faster to do this rather than
    //? deriving `totalDuration` from reducing `artistTopTracks`.
    const [agg] = await db
      .select({
        numTracks: count(tracks.id),
        totalDuration: sql`coalesce(sum(${tracks.duration}), 0)`.mapWith(
          Number,
        ),
      })
      .from(tracksToArtists)
      .where(eq(tracksToArtists.artistName, id))
      .innerJoin(tracks, eq(tracksToArtists.trackId, tracks.id));

    //? 3. Get tracks, sorted by how many times we played them.
    const artistTopTracks = await db
      .select({
        id: tracks.id,
        name: tracks.name,
        album: albums.name,
        artwork: sql<
          string | null
        >`coalesce(${tracks.artwork}, ${albums.artwork})`.as("derived_artwork"),
      })
      .from(tracksToArtists)
      .where(eq(tracksToArtists.artistName, id))
      .innerJoin(tracks, eq(tracksToArtists.trackId, tracks.id))
      .leftJoin(albums, eq(tracks.albumId, albums.id))
      .leftJoin(tracksPlayEvents, eq(tracks.id, tracksPlayEvents.trackId))
      .groupBy(tracksToArtists.trackId)
      .orderBy(
        sql`ceil(sum(${tracksPlayEvents.playTime}) / ${tracks.duration}) DESC`,
      );

    //? 4. Get albums, EPs, and albums containing singles.
    const artistAlbums = await db
      .select({
        id: albums.id,
        name: albums.name,
        artwork: albums.artwork,
        isEP: albums.isEP,
        minYear: sql<number>`coalesce(min(${tracks.year}), -1)`.as("min_year"),
        maxYear: sql<number>`coalesce(max(${tracks.year}), -1)`.as("max_year"),
        numTracks: sql<number>`coalesce(count(${tracks}), 0)`.as("num_tracks"),
      })
      .from(albumsToArtists)
      .where(eq(albumsToArtists.artistName, id))
      .innerJoin(albums, eq(albumsToArtists.albumId, albums.id))
      .innerJoin(tracks, eq(albums.id, tracks.albumId))
      .groupBy(albums.id)
      .orderBy(
        desc(sql<number>`coalesce(max(${tracks.year}), -1)`),
        desc(sql<number>`coalesce(min(${tracks.year}), -1)`),
      );

    const { singleAlbums, ...categorizedAlbums } = artistAlbums.reduce<{
      albums: MediaDetails.DisplayAlbum[];
      eps: MediaDetails.DisplayAlbum[];
      singleAlbums: MediaDetails.DisplayAlbum[];
    }>(
      (prev, { isEP, minYear, maxYear, numTracks, ...album }) => {
        let yearStr = `${minYear} - ${maxYear}`;
        if (minYear === -1) yearStr = "————";
        else if (minYear === maxYear) yearStr = `${maxYear}`;
        const formattedEntry = { ...album, year: yearStr };

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
        >`coalesce(${tracks.artwork}, ${albums.artwork})`.as("derived_artwork"),
      })
      .from(tracksToArtists)
      .innerJoin(tracks, eq(tracksToArtists.trackId, tracks.id))
      .leftJoin(albums, eq(tracks.albumId, albums.id))
      .orderBy(desc(tracks.year), asc(tracks.name))
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

    return {
      name: artist.name,
      artwork: artist.artwork,
      ...agg!,
      topTracks: artistTopTracks,
      ...categorizedAlbums,
      singles: artistSingles,
    };
  },
} as const satisfies Connector.Artist & Record<PropertyKey, unknown>;

export const LocalMediaAdapter = {
  artist: LocalMediaArtistConnector,
} as const satisfies Adapter;
