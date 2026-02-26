import {
  and,
  count,
  eq,
  getTableColumns,
  inArray,
  isNotNull,
  max,
  min,
  sql,
  sum,
} from "drizzle-orm";

import { db } from "~/db";
import { albums, albumsToArtists, artists, tracks } from "~/db/schema";

import { iAsc, throwIfNoResults } from "~/lib/drizzle";
import { omitKeys } from "~/utils/object";
import type { AlbumSummary, AlbumSummaryTrack, AlbumTrack } from "./types";
import { AlbumArtistsKey } from "./utils";
import type { DrizzleFilter } from "../types";
import { unencodeJSONArray } from "../utils";
import { getOrderedTrackArtistsView } from "../views";

type InsertedAlbum = typeof albums.$inferInsert;

const albumFields = omitKeys(getTableColumns(albums), [
  "altArtwork",
  "embeddedArtwork",
  "isFavorite",
]);

//#region GET Methods
/** Get all data associated with an album. */
export async function getAlbum(id: string) {
  const [albumDetails, albumTracks] = await Promise.all([
    getAlbumDetails(id),
    getAlbumTracks(id),
  ]);

  return { ...albumDetails, tracks: albumTracks };
}

/** Get the album object along with its year. */
export async function getAlbumDetails(id: string) {
  const [details, [range]] = await Promise.all([
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

  return { ...details, year: yearStr };
}

/**
 * Return the tracks associated with an album. It's not guaranteed that
 * the album exists.
 */
export async function getAlbumTracks<
  TOnlyIds extends boolean | undefined = false,
>(id: string, onlyIds?: TOnlyIds) {
  const orderedTrackArtists = getOrderedTrackArtistsView();

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

/** Get information summarizing each album (sorted by names). */
export async function getAlbumsSummary<
  TWithTracks extends boolean | undefined = false,
>(withTracks?: TWithTracks, conditions?: DrizzleFilter) {
  const orderedAlbumTracks = getOrderedAlbumTracksView();

  const results = await db
    .select({
      ...albumFields,
      duration: sum(orderedAlbumTracks.duration),
      trackCount: count(orderedAlbumTracks.id),
      //! This field is "hacked" in, with the main use for the "JSON Backup" feature.
      ...(withTracks
        ? {
            tracks: sql<string>`
              json_group_array(
                json_object(
                  'id', ${orderedAlbumTracks.id},
                  'name', ${orderedAlbumTracks.name},
                  'artwork', ${orderedAlbumTracks.artwork},
                  'artists', ${orderedAlbumTracks.artists}
                )
              )`.as("grouped_tracks"),
          }
        : {}),
    })
    .from(albums)
    .where(and(...(conditions ?? [])))
    .innerJoin(orderedAlbumTracks, eq(albums.id, orderedAlbumTracks.albumId))
    .groupBy(albums.name)
    .orderBy(iAsc(albums.name), iAsc(albums.artistsKey));

  return results
    .map(({ artistsKey, tracks, ...album }) => ({
      ...album,
      artistsKey,
      artistName: AlbumArtistsKey.toString(artistsKey),
      duration: Number(album.duration) || 0,
      ...(withTracks
        ? { tracks: parseAlbumTracks(album.artwork, tracks) }
        : {}),
    }))
    .sort((a, b) => a.name.localeCompare(b.name)) as TWithTracks extends true
    ? Array<AlbumSummary & { tracks: AlbumSummaryTrack[] }>
    : AlbumSummary[];
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

//#region Internal Utils
function getOrderedAlbumTracksView() {
  const orderedTrackArtists = getOrderedTrackArtistsView();

  return db
    .select({
      id: tracks.id,
      name: tracks.name,
      albumId: tracks.albumId,
      disc: tracks.disc,
      track: tracks.track,
      duration: tracks.duration,
      artwork: tracks.artwork,
      /** We need to unencode these fields. */
      artists:
        sql<string>`json_group_array(${orderedTrackArtists.artistName})`.as(
          "grouped_artists",
        ),
    })
    .from(tracks)
    .where(isNotNull(tracks.albumId))
    .leftJoin(orderedTrackArtists, eq(tracks.id, orderedTrackArtists.trackId))
    .groupBy(tracks.id)
    .orderBy(iAsc(tracks.disc), iAsc(tracks.track))
    .as("ordered_album_tracks_view");
}

function parseAlbumTracks(albumArtwork: string | null, tracks?: string) {
  if (!tracks) return [];
  let results: AlbumSummaryTrack[] = [];
  try {
    const asArray: any[] = JSON.parse(tracks);
    results = asArray
      .filter((i) => i.id !== null)
      .map((i) => ({
        ...i,
        artwork: i.artwork ?? albumArtwork,
        artists: unencodeJSONArray(i.artists),
      }));
  } catch {}
  return results;
}
//#endregion
