import { eq, sql } from "drizzle-orm";

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
      let yearStr = "————";
      if (minYear !== -1) {
        yearStr =
          maxYear === minYear ? `${maxYear}` : `${minYear} - ${maxYear}`;
      }

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
//#endregion
