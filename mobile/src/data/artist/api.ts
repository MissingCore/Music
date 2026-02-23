import { count, eq, getTableColumns, sql, sum } from "drizzle-orm";

import { db } from "~/db";
import {
  albums,
  albumsToArtists,
  artists,
  tracks,
  tracksToArtists,
} from "~/db/schema";

import { iAsc, throwIfNoResults } from "~/lib/drizzle";
import type { ArtistAlbum, ArtistTrack } from "./types";

type InsertedArtist = typeof artists.$inferInsert;

//#region GET Methods
/** Get all data associated with an artist. */
export async function getArtist<TOnlyIds extends boolean = false>(
  id: string,
  onlyIds?: TOnlyIds,
) {
  const [artistDetails, artistAlbums, artistTracks] = await Promise.all([
    throwIfNoResults(
      db.query.artists.findFirst({ where: eq(artists.name, id) }),
      "err.msg.noArtists",
    ),
    getArtistAlbums(id),
    getArtistTracks(id, onlyIds),
  ]);

  return { ...artistDetails, albums: artistAlbums, tracks: artistTracks };
}

/**
 * Return the albums associated with an artist, the newest albums first.
 * It's not guaranteed that the artist exists.
 */
export async function getArtistAlbums(id: string): Promise<ArtistAlbum[]> {
  const results = await db
    .select({
      id: albums.id,
      name: albums.name,
      artwork: albums.artwork,
      //* These works. If we have no year, they return `null`.
      minYear: sql<number>`coalesce(min(${tracks.year}), -1)`,
      maxYear: sql<number>`coalesce(max(${tracks.year}), -1)`,
    })
    .from(albumsToArtists)
    .where(eq(albumsToArtists.artistName, id))
    .innerJoin(albums, eq(albumsToArtists.albumId, albums.id))
    .innerJoin(tracks, eq(albumsToArtists.albumId, tracks.albumId))
    .groupBy(albumsToArtists.albumId);

  return results
    .sort((a, b) => b.maxYear - a.maxYear || b.minYear - a.minYear)
    .map(({ minYear, maxYear, ...album }) => {
      let yearStr = `${minYear} - ${maxYear}`;
      if (minYear === -1) yearStr = "————";
      else if (minYear === maxYear) yearStr = `${maxYear}`;

      return { ...album, year: yearStr };
    });
}

/**
 * Return the tracks associated with an artist. It's not guaranteed that
 * the artist exists.
 */
export async function getArtistTracks<TOnlyIds extends boolean = false>(
  id: string,
  onlyIds?: TOnlyIds,
) {
  const results = await db
    .select(
      onlyIds
        ? { id: tracks.id }
        : {
            id: tracks.id,
            name: tracks.name,
            artwork: sql<
              string | null
            >`coalesce(${tracks.artwork}, ${albums.artwork})`.as(
              "derived_artwork",
            ),
            duration: tracks.duration,
            album: albums.name,
          },
    )
    .from(tracksToArtists)
    .where(eq(tracksToArtists.artistName, id))
    .innerJoin(tracks, eq(tracksToArtists.trackId, tracks.id))
    .leftJoin(albums, eq(tracks.albumId, albums.id))
    .orderBy(iAsc(tracks.name));

  return results as TOnlyIds extends true
    ? Array<{ id: string }>
    : ArtistTrack[];
}

/** Get information summarizing each artist (sorted by names). */
export async function getArtistsSummary() {
  const results = await db
    .select({
      ...getTableColumns(artists),
      duration: sum(tracks.duration),
      trackCount: count(tracks.id),
    })
    .from(artists)
    .innerJoin(tracksToArtists, eq(artists.name, tracksToArtists.artistName))
    .innerJoin(tracks, eq(tracksToArtists.trackId, tracks.id))
    .groupBy(artists.name)
    .orderBy(iAsc(artists.name));

  return results
    .filter(({ trackCount }) => trackCount > 0)
    .map((artist) => ({ ...artist, duration: Number(artist.duration) || 0 }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
//#endregion

//#region POST Methods
export async function createArtists(entries: InsertedArtist[]) {
  return db.insert(artists).values(entries).onConflictDoNothing();
}
//#endregion

//#region PATCH Methods
export async function updateArtist(
  id: string,
  values: Partial<Omit<InsertedArtist, "name">>,
) {
  return db.update(artists).set(values).where(eq(artists.name, id));
}
//#endregion
