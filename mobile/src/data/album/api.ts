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
import type { AlbumSummary, AlbumTrack } from "./types";
import { AlbumArtistsKey } from "./utils";
import type { CommonTrack, DrizzleFilter } from "../types";
import { fromJSONArrayString } from "../utils";
import { commonTrackColumns, getStructuredTracksView } from "../views";

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
  const structuredTracks = getStructuredTracksView();

  const results: Array<Record<string, unknown>> = await db
    .select(
      onlyIds
        ? { id: structuredTracks.id }
        : {
            ...commonTrackColumns,
            disc: structuredTracks.disc,
            track: structuredTracks.track,
          },
    )
    .from(structuredTracks)
    .where(eq(structuredTracks.albumId, id))
    .orderBy(iAsc(structuredTracks.disc), iAsc(structuredTracks.track));

  return (
    onlyIds
      ? results
      : results.map(({ artists, ...rest }) => ({
          ...rest,
          artists: fromJSONArrayString(artists),
        }))
  ) as TOnlyIds extends true ? Array<{ id: string }> : AlbumTrack[];
}

/** Get information summarizing each album (sorted by names). */
export async function getAlbumsSummary<
  TWithTracks extends boolean | undefined = false,
>(withTracks?: TWithTracks, conditions?: DrizzleFilter) {
  const structuredTracks = getStructuredTracksView();
  const orderedAlbumTracks = db
    .select()
    .from(structuredTracks)
    .where(isNotNull(structuredTracks.albumId))
    .orderBy(iAsc(structuredTracks.disc), iAsc(structuredTracks.track))
    .as("ordered_album_tracks_view");

  const results = await db
    .select({
      ...albumFields,
      maxYear: max(orderedAlbumTracks.year),
      duration: sum(orderedAlbumTracks.duration),
      trackCount: count(orderedAlbumTracks.id),
      //! This field is "hacked" in.
      ...(withTracks
        ? {
            tracks: sql<string>`
              json_group_array(
                json_object(
                  'id', ${orderedAlbumTracks.id},
                  'name', ${orderedAlbumTracks.name},
                  'artwork', ${orderedAlbumTracks.artwork},
                  'artists', ${orderedAlbumTracks.artists},
                  'albumName', ${orderedAlbumTracks.albumName},
                  'uri', ${orderedAlbumTracks.uri},
                  'duration', ${orderedAlbumTracks.duration}
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
    ? Array<AlbumSummary & { tracks: CommonTrack[] }>
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
function parseAlbumTracks(albumArtwork: string | null, tracks?: string) {
  if (!tracks) return [];
  let results: CommonTrack[] = [];
  try {
    const asArray: any[] = JSON.parse(tracks);
    results = asArray
      .filter((i) => i.id !== null)
      .map((i) => ({
        ...i,
        artwork: i.artwork ?? albumArtwork,
        artists: fromJSONArrayString(i.artists),
      }));
  } catch {}
  return results;
}
//#endregion
