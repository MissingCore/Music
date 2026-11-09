// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { and, count, eq, gt, notExists, sql } from "drizzle-orm";

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
import { albumsView } from "./views";
import type { Adapter, Connector } from "../types";

const LocalMediaArtistConnector = {
  async get(id) {
    const artist = await throwIfNoResults(
      db.query.artists.findFirst({ where: eq(artists.name, id) }),
      "err.msg.noArtists",
    );
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

    const topTracks = await this.getTopTracks(id);
    const artistAlbums = await this.getAlbums(id);
    const artistEPs = await this.getEPs(id);
    const artistSingles = await this.getSingles(id);

    return {
      name: artist.name,
      artwork: artist.artwork,
      ...agg!,
      topTracks,
      albums: artistAlbums,
      eps: artistEPs,
      singles: artistSingles,
    };
  },

  async getAlbums(id: string) {
    const results = await db
      .select({
        id: albumsView.id,
        name: albumsView.name,
        artwork: albumsView.artwork,
        minYear: albumsView.minYear,
        maxYear: albumsView.maxYear,
      })
      .from(albumsToArtists)
      .innerJoin(albumsView, eq(albumsToArtists.albumId, albumsView.id))
      .where(
        and(
          eq(albumsToArtists.artistName, id),
          eq(albumsView.isEP, false),
          gt(albumsView.numTracks, 1),
        ),
      );

    return results.map(({ minYear, maxYear, ...album }) => {
      let yearStr = `${minYear} - ${maxYear}`;
      if (minYear === -1) yearStr = "————";
      else if (minYear === maxYear) yearStr = `${maxYear}`;

      return { ...album, year: yearStr };
    });
  },

  async getEPs(id: string) {
    const results = await db
      .select({
        id: albumsView.id,
        name: albumsView.name,
        artwork: albumsView.artwork,
        minYear: albumsView.minYear,
        maxYear: albumsView.maxYear,
      })
      .from(albumsToArtists)
      .innerJoin(albumsView, eq(albumsToArtists.albumId, albumsView.id))
      .where(
        and(eq(albumsToArtists.artistName, id), eq(albumsView.isEP, true)),
      );

    return results.map(({ minYear, maxYear, ...album }) => {
      let yearStr = `${minYear} - ${maxYear}`;
      if (minYear === -1) yearStr = "————";
      else if (minYear === maxYear) yearStr = `${maxYear}`;

      return { ...album, year: yearStr };
    });
  },

  async getSingles(id: string) {
    const singleTrackAlbums = await db
      .select({
        id: tracks.id,
        name: tracks.name,
        album: albumsView.name,
        artwork: sql<
          string | null
        >`coalesce(${tracks.artwork}, ${albumsView.artwork})`.as(
          "derived_artwork",
        ),
      })
      .from(albumsToArtists)
      .innerJoin(albumsView, eq(albumsToArtists.albumId, albumsView.id))
      .where(
        and(
          eq(albumsToArtists.artistName, id),
          eq(albumsView.isEP, false),
          eq(albumsView.numTracks, 1),
        ),
      )
      .innerJoin(tracks, eq(albumsView.id, tracks.albumId));

    //? Handles both cases as if there can be no album entry for the track
    //? if it has no albums or it belongs in a different album.
    const tracksInOtherAlbumsAndWithoutAlbums = await db
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
      .where(
        and(
          eq(tracksToArtists.artistName, id),
          notExists(
            db
              .select()
              .from(albumsToArtists)
              .where(
                and(
                  eq(tracks.albumId, albumsToArtists.albumId),
                  eq(albumsToArtists.artistName, id),
                ),
              ),
          ),
        ),
      );

    return [...singleTrackAlbums, ...tracksInOtherAlbumsAndWithoutAlbums].sort(
      (a, b) => a.name.localeCompare(b.name),
    );
  },

  async getTopTracks(id) {
    return db
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
  },
} as const satisfies Connector.Artist & Record<PropertyKey, unknown>;

export const LocalMediaAdapter = {
  artist: LocalMediaArtistConnector,
} as const satisfies Adapter;
