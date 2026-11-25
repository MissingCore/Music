// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { asc, count, eq, inArray, sql } from "drizzle-orm";

import { db } from "~/db";
import {
  albums,
  genres,
  tracks,
  tracksPlayEvents,
  tracksToArtists,
  tracksToGenres,
} from "~/db/schema";
import { getGenresWithArtwork } from "~/db/queries/genre";

import { throwIfNoResults } from "~/_next/utils/drizzle";
import type { Connector } from "../../types";

export const LocalMediaGenreConnector = {
  async get(id) {
    //? 1. Get basic stored genre details. Throws an error if the genre doesn't exist.
    const [genre] = await throwIfNoResults(
      getGenresWithArtwork().where(eq(genres.name, id)).limit(1),
      "err.msg.noGenres",
    );

    //? 2. Get aggregated data related to its tracks. It's faster to do this rather than
    //? deriving `totalDuration` from reducing `genreTopTracks`.
    const [agg] = await throwIfNoResults(
      db
        .select({
          numTracks: count(tracks.id),
          totalDuration: sql`coalesce(sum(${tracks.duration}), 0)`.mapWith(
            Number,
          ),
        })
        .from(tracksToGenres)
        .where(eq(tracksToGenres.genreName, id))
        .innerJoin(tracks, eq(tracksToGenres.trackId, tracks.id)),
    );

    //? 3. Get tracks, sorted by how many times we played them.
    const genreTopTracks = await db
      .select({
        id: tracks.id,
        name: tracks.name,
        //? Left-joining on `tracksToArtists` will cause the play count calculation to multiply.
        artists: sql`(
          SELECT NULLIF(
            json_group_array(${tracksToArtists.artistName} ORDER BY ${tracksToArtists.artistName}),
            '[]'
          )
          FROM ${tracksToArtists}
          WHERE ${tracksToArtists.trackId} = ${tracks.id}
        )`.mapWith((val): string[] | null =>
          val !== null ? JSON.parse(val) : null,
        ),
        artwork: sql<
          string | null
        >`coalesce(${tracks.artwork}, ${albums.artwork})`,
      })
      .from(tracksToGenres)
      .where(eq(tracksToGenres.genreName, id))
      .innerJoin(tracks, eq(tracksToGenres.trackId, tracks.id))
      .leftJoin(albums, eq(tracks.albumId, albums.id))
      .leftJoin(tracksPlayEvents, eq(tracks.id, tracksPlayEvents.trackId))
      .groupBy(tracksToGenres.trackId)
      .orderBy(
        sql`coalesce(ceil(sum(${tracksPlayEvents.playTime}) / ${tracks.duration}), 0) DESC`,
        asc(tracks.name),
      );

    return {
      name: genre.name,
      artwork: genre.artwork,
      ...agg,
      topTracks: genreTopTracks,
    };
  },

  async getTrackIds(id) {
    return db
      .select({ id: tracksToGenres.trackId })
      .from(tracksToGenres)
      .where(eq(tracksToGenres.genreName, id));
  },

  /** Update genres & related relations. */
  async update(id: string, values: Partial<typeof genres.$inferSelect>) {
    //? Skip if nothing gets updated.
    if (values.name === undefined && values.artwork === undefined) return;
    //? Throw an error if `id = values.name` (since this shouldn't be possible).
    if (id === values.name)
      throw new Error(`\`values.name\` should not equal ${id}.`);

    return db.transaction(async (tx) => {
      //? Simple artwork update.
      if (values.name === undefined) {
        await tx.update(genres).set(values).where(eq(genres.name, id));
        return;
      }

      const priorValues = await tx.query.genres.findFirst({
        where: (fields, { eq }) => eq(fields.name, id),
      });
      if (!priorValues) return;
      const newGenre = { ...priorValues, ...values };

      //? Insert genre entry (to preserve referential integrity).
      await tx.insert(genres).values(newGenre).onConflictDoNothing();
      if (values.artwork !== undefined)
        await tx
          .update(genres)
          .set({ artwork: values.artwork })
          .where(eq(genres.name, newGenre.name));

      //? Update track relations.
      const trackIds = await tx.query.tracksToGenres.findMany({
        columns: { trackId: true },
        where: (fields, { eq }) => eq(fields.genreName, id),
      });
      if (trackIds.length > 0) {
        await tx.delete(tracksToGenres).where(eq(tracksToGenres.genreName, id));
        await tx
          .insert(tracksToGenres)
          .values(
            trackIds.map(({ trackId }) => {
              return { trackId, genreName: newGenre.name };
            }),
          )
          .onConflictDoNothing();
        await tx
          .update(tracks)
          .set({ editedMetadata: Date.now() })
          .where(
            inArray(
              tracks.id,
              trackIds.map(({ trackId }) => trackId),
            ),
          );
      }
    });
  },
} as const satisfies Connector.Genre & Record<PropertyKey, unknown>;
