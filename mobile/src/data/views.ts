import { eq, getTableColumns, sql } from "drizzle-orm";

import { db } from "~/db";
import { albums, tracks, tracksToArtists } from "~/db/schema";

import { getSubqueryFields, iAsc } from "~/lib/drizzle";
import { pickKeys } from "~/utils/object";

/**
 * Order the `tracksToArtists` table by artist names. Used for ensuring
 * artist name order when generating the `artists` field on tracks.
 *
 * @deprecated Use `orderedTrackArtistsView`.
 */
export function getOrderedTrackArtistsView() {
  return db
    .select()
    .from(tracksToArtists)
    .orderBy(iAsc(tracksToArtists.artistName))
    .as("ordered_track_artists_view");
}

export const orderedTrackArtistsView = getOrderedTrackArtistsView();

const { artwork: _, ...trackColumns } = getTableColumns(tracks);

/**
 * Join main relations (album & artists) onto `tracks` table.
 *  - `artwork` contains the appropriate artwork (from track or album).
 *  - `artists` contains a JSON-stringified array (`string[]` or `[null]`).
 */
export const structuredTracksView = db
  .select({
    ...trackColumns,
    artwork: sql<
      string | null
    >`coalesce(${tracks.artwork}, ${albums.artwork})`.as("derived_artwork"),
    albumName: albums.name,
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

export const commonTrackColumns = pickKeys(
  getSubqueryFields(structuredTracksView),
  ["id", "name", "artwork", "artists", "albumName", "uri", "duration"],
);
