import { count, eq, getTableColumns, sql, sum } from "drizzle-orm";

import { db } from "~/db";
import { albums, tracks, tracksToArtists } from "~/db/schema";

import { getSubqueryFields, iAsc } from "~/lib/drizzle";
import { omitKeys, pickKeys } from "~/utils/object";

//#region Album View
const albumFields = omitKeys(getTableColumns(albums), [
  "altArtwork",
  "embeddedArtwork",
]);

export const albumListsView = db
  .select({
    ...albumFields,
    duration: sum(tracks.duration).as("total_duration"),
    trackCount: count(tracks.id).as("total_track_count"),
  })
  .from(albums)
  .innerJoin(tracks, eq(albums.id, tracks.albumId))
  .groupBy(albums.name)
  .orderBy(iAsc(albums.name), iAsc(albums.artistsKey))
  .as("album_lists_view");
//#endregion

/**
 * Order the `tracksToArtists` table by artist names. Used for ensuring
 * artist name order when generating the `artists` field on tracks.
 */
const orderedTrackArtistsView = db
  .select()
  .from(tracksToArtists)
  .orderBy(iAsc(tracksToArtists.artistName))
  .as("ordered_track_artists_view");

const { artwork: _, ...trackColumns } = getTableColumns(tracks);

/**
 * Join main relations (album & artists) onto `tracks` table.
 *  - `artwork` contains the appropriate artwork (from track or album).
 *  - `artists` contains a JSON-stringified array (`string[]`) or `null`.
 */
export const structuredTracksView = db
  .select({
    ...trackColumns,
    artwork: sql<
      string | null
    >`coalesce(${tracks.artwork}, ${albums.artwork})`.as("derived_artwork"),
    //? For some weird reason, using `albums.name` directly returns `tracks.name`.
    albumName: sql<string | null>`${albums.name}`.as("album_name"),
    albumArtistsKey: albums.artistsKey,
    artistsName: sql<
      string | null
    >`GROUP_CONCAT(${orderedTrackArtistsView.artistName}, ', ')`.as(
      "joined_artists_name",
    ),
    /** We need to unencode these fields. */
    artists: sql<
      string | null
    >`NULLIF(json_group_array(${orderedTrackArtistsView.artistName}), '[null]')`.as(
      "derived_artists",
    ),
  })
  .from(tracks)
  .leftJoin(albums, eq(tracks.albumId, albums.id))
  .leftJoin(
    orderedTrackArtistsView,
    eq(tracks.id, orderedTrackArtistsView.trackId),
  )
  .groupBy(tracks.id)
  .as("structured_tracks_view");

//? Used for type inference since we can't directly call `typeof` on an anonymous function.
const _getStructuredTracks = async () => db.select().from(structuredTracksView);
export type StructuredTracksResult = Awaited<
  ReturnType<typeof _getStructuredTracks>
>[number];

export const sharedTrackColumns = pickKeys(
  getSubqueryFields(structuredTracksView),
  [
    "id",
    "name",
    "artwork",
    "uri",
    "duration",
    "artistsName",
    "artists",
    "albumName",
    "albumId",
    "discoverTime",
    "modificationTime",
    "parentFolder",
  ],
);
