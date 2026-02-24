import {
  and,
  count,
  eq,
  getTableColumns,
  inArray,
  max,
  min,
  sql,
  sum,
} from "drizzle-orm";

import { db } from "~/db";
import {
  albums,
  albumsToArtists,
  artists,
  tracks,
  tracksToArtists,
} from "~/db/schema";
import type { SlimAlbum, SlimAlbumWithTracks } from "~/db/slimTypes";

// FIXME: Want to eventually move to `~/data/albums/utils.ts`.
import { AlbumArtistsKey } from "~/api/album.utils";

import { iAsc, throwIfNoResults } from "~/lib/drizzle";
import { omitKeys } from "~/utils/object";
import type { AlbumTrack } from "./types";
import type { DrizzleFilter } from "../types";
import { unencodeJSONArray } from "../utils";

type InsertedAlbum = typeof albums.$inferInsert;

const albumFields = omitKeys(getTableColumns(albums), [
  "altArtwork",
  "embeddedArtwork",
  "isFavorite",
]);

//#region GET Methods
/** Get all data associated with an album. */
export async function getAlbum<TOnlyIds extends boolean = false>(
  id: string,
  onlyIds?: TOnlyIds,
) {
  const [albumDetails, albumTracks] = await Promise.all([
    getAlbumDetails(id),
    getAlbumTracks(id, onlyIds),
  ]);

  return { ...albumDetails, tracks: albumTracks };
}

/** Get the album object along with it's year. */
export async function getAlbumDetails(id: string) {
  const [albumDetails, [range]] = await Promise.all([
    throwIfNoResults(
      db.query.albums.findFirst({ where: eq(albums.id, id) }),
      "err.msg.noAlbums",
    ),
    db
      .select({ minYear: min(tracks.year), maxYear: max(tracks.year) })
      .from(tracks)
      .where(eq(tracks.albumId, id)),
  ]);

  let yearStr: string | null = null;
  if (range && range.minYear !== null && range.maxYear !== null) {
    if (range.minYear === range.maxYear) yearStr = `${range.maxYear}`;
    else yearStr = `${range.minYear} - ${range.maxYear}`;
  }

  return { ...albumDetails, year: yearStr };
}

/**
 * Return the tracks associated with an album. It's not guaranteed that
 * the album exists.
 */
export async function getAlbumTracks<TOnlyIds extends boolean = false>(
  id: string,
  onlyIds?: TOnlyIds,
) {
  //? Subquery to order the artist names associated with a track.
  const orderedTrackArtists = db
    .select(getTableColumns(tracksToArtists))
    .from(tracksToArtists)
    .orderBy(iAsc(tracksToArtists.artistName))
    .as("ordered_track_artists");

  const results = await db
    .select(
      onlyIds
        ? { id: tracks.id }
        : {
            id: tracks.id,
            name: tracks.name,
            duration: tracks.duration,
            disc: tracks.disc,
            track: tracks.track,
            /** We need to unencode these fields. */
            artists: sql<string>`json_group_array(${orderedTrackArtists.artistName})`,
          },
    )
    .from(tracks)
    .where(eq(tracks.albumId, id))
    .leftJoin(orderedTrackArtists, eq(tracks.id, orderedTrackArtists.trackId))
    .groupBy(tracks.id)
    .orderBy(iAsc(tracks.disc), iAsc(tracks.track));

  return (
    onlyIds
      ? results
      : results.map(({ artists, ...rest }) => ({
          ...rest,
          artists: unencodeJSONArray(artists as string),
        }))
  ) as TOnlyIds extends true ? Array<{ id: string }> : AlbumTrack[];
}

/** Return albums in their "slim" form. */
export async function getAlbums<
  TWithTracks extends boolean | undefined = false,
>(withTracks?: TWithTracks, conditions?: DrizzleFilter) {
  return db.query.albums.findMany({
    where: and(...(conditions ?? [])),
    columns: { id: true, name: true, artistsKey: true, artwork: true },
    ...(withTracks
      ? {
          with: {
            tracks: {
              columns: { id: true, name: true, artwork: true },
              with: {
                tracksToArtists: {
                  columns: { artistName: true },
                },
              },
              orderBy: [iAsc(tracks.disc), iAsc(tracks.track)],
            },
          },
        }
      : {}),
    orderBy: [iAsc(albums.name), iAsc(albums.artistsKey)],
  }) as unknown as Promise<
    Array<TWithTracks extends true ? SlimAlbumWithTracks : SlimAlbum>
  >;
}

/** Get information summarizing each album (sorted by names). */
export async function getAlbumsSummary() {
  const results = await db
    .select({
      ...albumFields,
      duration: sum(tracks.duration),
      trackCount: count(tracks.id),
    })
    .from(albums)
    .innerJoin(tracks, eq(albums.id, tracks.albumId))
    .groupBy(albums.name)
    .orderBy(iAsc(albums.name), iAsc(albums.artistsKey));

  return results
    .map(({ artistsKey, ...album }) => ({
      ...album,
      artistName: AlbumArtistsKey.toString(artistsKey),
      duration: Number(album.duration) || 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
//#endregion

//#region PATCH Methods
export async function updateAlbum(id: string, values: Partial<InsertedAlbum>) {
  return db.update(albums).set(values).where(eq(albums.id, id));
}
//#endregion

//#region PUT Methods
/** Create/update album entries and its relations. Returns the created albums. */
export function upsertAlbums(entries: InsertedAlbum[]) {
  return db.transaction(async (tx) => {
    const results = await tx
      .insert(albums)
      .values(entries)
      .onConflictDoUpdate({
        target: [albums.name, albums.artistsKey],
        // Replace `name` with passed name to allow `.returning()` to return
        // a value if a conflict occurs.
        set: { name: sql`excluded.name` },
      })
      .returning();

    // Create album-artist relations along with artists if they don't exist.
    const newArtists = new Set<string>();
    const newRels: Array<{ albumId: string; artistName: string }> = [];
    results.forEach(({ id: albumId, artistsKey }) => {
      AlbumArtistsKey.deconstruct(artistsKey).forEach((artistName) => {
        newArtists.add(artistName);
        newRels.push({ albumId, artistName });
      });
    });

    if (newRels.length > 0) {
      const artistEntries = [...newArtists].map((name) => ({ name }));
      await tx.insert(artists).values(artistEntries).onConflictDoNothing();
      // Remove old album-artist relations before inserting new ones.
      const albumIds = results.map(({ id }) => id);
      await tx
        .delete(albumsToArtists)
        .where(inArray(albumsToArtists.albumId, albumIds));
      await tx.insert(albumsToArtists).values(newRels);
    }

    return results;
  });
}
//#endregion
