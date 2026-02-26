import { and, eq, getTableColumns, inArray, sql } from "drizzle-orm";

import { db } from "~/db";
import type { InvalidTrack } from "~/db/schema";
import {
  albums,
  invalidTracks,
  tracks,
  tracksToArtists,
  tracksToPlaylists,
} from "~/db/schema";

import { viewPreferenceStore } from "~/stores/ViewPreference/store";
import type { ScreenSortOptions } from "~/stores/ViewPreference/constants";

import {
  getExcludedColumns,
  iAsc,
  iDesc,
  throwIfNoResults,
} from "~/lib/drizzle";
import { omitKeys } from "~/utils/object";
import { FavoritesPlaylistKey } from "~/modules/media/constants";
import { TrackRelationTables } from "./constants";
import type { BulkQueriedTrack, SortedTrack, Track } from "./types";
import type { DrizzleFilter } from "../types";
import { unencodeJSONArray } from "../utils";
import { getOrderedTrackArtistsView } from "../views";

type InsertedTrack = typeof tracks.$inferInsert;
type InsertedTrackPlaylistRelation = typeof tracksToPlaylists.$inferInsert;

const trackFields = omitKeys(getTableColumns(tracks), [
  "rawArtistName",
  "isFavorite",
  "hiddenAt",
  "artwork",
]);

//#region GET Methods
export async function getTrack(id: string): Promise<Track> {
  const orderedTrackArtists = getOrderedTrackArtistsView();

  const [result] = await throwIfNoResults(
    db
      .select({
        ...trackFields,
        artwork: sql<
          string | null
        >`coalesce(${tracks.artwork}, ${albums.artwork})`.as("derived_artwork"),
        album: sql<string | null>`${albums.name}`.as("album"),
        albumArtistsKey: sql<string | null>`${albums.artistsKey}`.as(
          "album_artists_key",
        ),
        /** We need to unencode these fields. */
        artists: sql<string>`json_group_array(${orderedTrackArtists.artistName})`,
      })
      .from(tracks)
      .where(eq(tracks.id, id))
      .leftJoin(albums, eq(tracks.albumId, albums.id))
      .leftJoin(orderedTrackArtists, eq(tracks.id, orderedTrackArtists.trackId))
      .groupBy(tracks.id),
    "err.msg.noTracks",
  );

  return { ...result!, artists: unencodeJSONArray(result!.artists) };
}

//#region Get Relations
export async function getTrackFavoriteStatus(id: string) {
  const isFavorited = await db.query.tracksToPlaylists.findFirst({
    where: (fields, { and, eq }) =>
      and(
        eq(fields.playlistName, FavoritesPlaylistKey),
        eq(fields.trackId, id),
      ),
  });
  return isFavorited ? true : false;
}

export async function getTrackGenres(id: string) {
  const results = await db.query.tracksToGenres.findMany({
    where: (fields, { eq }) => eq(fields.trackId, id),
    columns: { genreName: true },
  });
  return results.map((rel) => rel.genreName);
}

export async function getTrackLyrics(id: string) {
  const result = await db.query.tracksToLyrics.findFirst({
    where: (fields, { eq }) => eq(fields.trackId, id),
    with: { lyric: true },
  });
  return result?.lyric ?? null;
}

export async function getTrackPlaylists(id: string) {
  const results = await db.query.tracksToPlaylists.findMany({
    where: (fields, { eq }) => eq(fields.trackId, id),
    columns: { playlistName: true },
  });
  return results.map((rel) => rel.playlistName);
}
//#endregion

/** Return the tracks sorted by the View Preferences. */
export async function getSortedTracks<
  TOnlyIds extends boolean | undefined = false,
>(
  onlyIds?: TOnlyIds,
  sortOptions?: { isAsc: boolean; order: ScreenSortOptions<"track"> },
) {
  const { trackIsAsc, trackOrder } = viewPreferenceStore.getState();

  const isAsc = sortOptions?.isAsc ?? trackIsAsc;
  const order = sortOptions?.order ?? trackOrder;

  //? Subquery to order the track artists before we use `GROUP_CONCAT` on them.
  const orderedTrackArtists = db
    .select({
      trackId: tracksToArtists.trackId,
      artistName:
        sql<string>`GROUP_CONCAT(${tracksToArtists.artistName}, ', ')`.as(
          "joined_artistname",
        ),
    })
    .from(tracksToArtists)
    .orderBy(iAsc(tracksToArtists.trackId), iAsc(tracksToArtists.artistName))
    .groupBy(tracksToArtists.trackId)
    .as("ordered_track_artists");
  //? Determine field we'll sort by.
  const sortField =
    order === "albumName"
      ? albums.name
      : order === "artistName"
        ? orderedTrackArtists.artistName
        : tracks[order];

  const results = await db
    .select(
      onlyIds
        ? { id: tracks.id }
        : {
            id: tracks.id,
            name: tracks.name,
            artistName: orderedTrackArtists.artistName,
            albumName: albums.name,
            duration: tracks.duration,
            discoverTime: tracks.discoverTime,
            modificationTime: tracks.modificationTime,
            artwork: sql<
              string | null
            >`coalesce(${tracks.artwork}, ${albums.artwork})`,
          },
    )
    .from(tracks)
    .leftJoin(orderedTrackArtists, eq(tracks.id, orderedTrackArtists.trackId))
    .leftJoin(albums, eq(tracks.albumId, albums.id))
    .groupBy(tracks.id)
    .orderBy(isAsc ? iAsc(sortField) : iDesc(sortField));

  return results as TOnlyIds extends true
    ? Array<{ id: string }>
    : SortedTrack[];
}

export async function getTracks(
  conditions?: DrizzleFilter,
): Promise<BulkQueriedTrack[]> {
  const orderedTrackArtists = getOrderedTrackArtistsView();

  const results = await db
    .select({
      id: tracks.id,
      name: tracks.name,
      rawArtistName: tracks.rawArtistName,
      artwork: sql<
        string | null
      >`coalesce(${tracks.artwork}, ${albums.artwork})`.as("derived_artwork"),
      albumId: tracks.albumId,
      album: sql<string | null>`${albums.name}`.as("album"),
      uri: tracks.uri,
      parentFolder: tracks.parentFolder,
      /** We need to unencode these fields. */
      artists: sql<string>`json_group_array(${orderedTrackArtists.artistName})`,
    })
    .from(tracks)
    .where(and(...(conditions ?? [])))
    .leftJoin(albums, eq(tracks.albumId, albums.id))
    .leftJoin(orderedTrackArtists, eq(tracks.id, orderedTrackArtists.trackId))
    .groupBy(tracks.id)
    .orderBy(iAsc(tracks.name));

  return results.map(({ artists, ...track }) => ({
    ...track,
    artists: unencodeJSONArray(artists),
  }));
}
//#endregion

//#region PATCH Methods
export async function updateTrack(
  id: string,
  values: Partial<Omit<InsertedTrack, "id">>,
) {
  return db.update(tracks).set(values).where(eq(tracks.id, id));
}
//#endregion

//#region PUT Methods
export function toggleTrackInPlaylist(entry: InsertedTrackPlaylistRelation) {
  return db.transaction(async (tx) => {
    const condition = and(
      eq(tracksToPlaylists.playlistName, entry.playlistName),
      eq(tracksToPlaylists.trackId, entry.trackId),
    );

    if (await tx.query.tracksToPlaylists.findFirst({ where: condition })) {
      await tx.delete(tracksToPlaylists).where(condition);
    } else {
      // Figure out last position in playlist.
      const lastTrack = await tx.query.tracksToPlaylists.findFirst({
        where: eq(tracksToPlaylists.playlistName, entry.playlistName),
        orderBy: iDesc(tracksToPlaylists.position),
      });
      const position = (lastTrack?.position ?? -1) + 1;
      // No conflict check as the track shouldn't exist in the playlist.
      await tx.insert(tracksToPlaylists).values({ ...entry, position });
    }
  });
}

/** Create/update track entries. */
export function upsertTracks(entries: InsertedTrack[]) {
  return db.insert(tracks).values(entries).onConflictDoUpdate({
    target: tracks.id,
    set: UpsertFields,
  });
}
//#endregion

//#region DELETE Methods
type ErrorInfo = { errorName: string; errorMessage: string };

/** Delete track entries, with the option of inserting them into the `InvalidTrack` schema. */
export async function deleteTracks(
  entries: Array<{ id: string; errorInfo?: ErrorInfo }>,
) {
  return db.transaction(async (tx) => {
    const removedIds: string[] = [];
    const erroredIds = new Set<string>();
    const errorInfoMap: Record<string, ErrorInfo> = {};
    for (const { id, errorInfo } of entries) {
      removedIds.push(id);
      if (errorInfo) {
        erroredIds.add(id);
        errorInfoMap[id] = errorInfo;
      }
    }

    // Remove relations
    await Promise.all(
      TrackRelationTables.map((sch) =>
        tx.delete(sch).where(inArray(sch.trackId, removedIds)),
      ),
    );

    const deletedTracks = await tx
      .delete(tracks)
      .where(inArray(tracks.id, removedIds))
      .returning({
        id: tracks.id,
        uri: tracks.uri,
        modificationTime: tracks.modificationTime,
      });

    // Exit early if we don't need to add entries to the `InvalidTrack` schema.
    if (erroredIds.size === 0 || deletedTracks.length === 0) return;

    const invalidTracksEntries: InvalidTrack[] = [];
    for (const deletedTrack of deletedTracks) {
      if (!erroredIds.has(deletedTrack.id)) continue;
      const errorInfo = errorInfoMap[deletedTrack.id];
      if (!errorInfo) continue;
      invalidTracksEntries.push({ ...deletedTrack, ...errorInfo });
    }

    if (invalidTracksEntries.length === 0) return;
    // Insert into `InvalidTrack` schema.
    await tx
      .insert(invalidTracks)
      .values(invalidTracksEntries)
      .onConflictDoUpdate({
        target: invalidTracks.id,
        // Replace existing fields with new values.
        set: getExcludedColumns([
          "modificationTime",
          "errorName",
          "errorMessage",
        ]),
      });
  });
}
//#endregion

//#region Internal Utils
const UpsertFields = getExcludedColumns([
  "name",
  "rawArtistName", // ! This field is deprecated.
  "albumId",
  "disc",
  "track",
  "year",
  "duration",
  "format",
  "bitrate",
  "sampleRate",
  "uri",
  "modificationTime",
  "fetchedArt",
  "size",
]);
//#endregion
