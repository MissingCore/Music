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
import { formatSeconds } from "~/utils/number";
import type { ArtistAlbum } from "./types";
import type { CommonTrack, TracksSortOptions } from "../types";
import { commonTracksOrIds, getTracksOrderedBy } from "../utils";
import { commonTrackColumns, structuredTracksView } from "../views";

type InsertedArtist = typeof artists.$inferInsert;

//#region GET Methods
/** Get all data associated with an artist. */
export async function getArtist<TOnlyIds extends boolean | undefined = false>(
  id: string,
  onlyIds?: TOnlyIds,
  sortOptions?: TracksSortOptions<"artistTracks">,
) {
  const [artistDetails, artistAlbums, artistTracks] = await Promise.all([
    getArtistDetails(id),
    getArtistAlbums(id),
    getSortedArtistTracks(id, onlyIds, sortOptions),
  ]);

  return { ...artistDetails, albums: artistAlbums, tracks: artistTracks };
}

export async function getArtistDetails(id: string) {
  const [details, [agg]] = await Promise.all([
    throwIfNoResults(
      db.query.artists.findFirst({ where: eq(artists.name, id) }),
      "err.msg.noArtists",
    ),
    db
      .select({ duration: sum(tracks.duration) })
      .from(tracksToArtists)
      .where(eq(tracksToArtists.artistName, id))
      .innerJoin(tracks, eq(tracksToArtists.trackId, tracks.id)),
  ]);

  return {
    ...details,
    duration: formatSeconds(agg?.duration ? +agg.duration : 0),
  };
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
 * Return the tracks associated with an artist in the specified sort order.
 * It's not guaranteed that the artist exists.
 */
export async function getSortedArtistTracks<
  TOnlyIds extends boolean | undefined = false,
>(
  id: string,
  onlyIds?: TOnlyIds,
  sortOptions?: TracksSortOptions<"artistTracks">,
) {
  const results = await db
    .select(onlyIds ? { id: structuredTracksView.id } : commonTrackColumns)
    .from(tracksToArtists)
    .where(eq(tracksToArtists.artistName, id))
    .innerJoin(
      structuredTracksView,
      eq(tracksToArtists.trackId, structuredTracksView.id),
    )
    .orderBy(getTracksOrderedBy("artistTracks", sortOptions));

  return commonTracksOrIds<CommonTrack, TOnlyIds>(results, onlyIds);
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
