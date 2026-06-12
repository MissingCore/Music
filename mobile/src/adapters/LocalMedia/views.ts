import { count, eq, getTableColumns, max, min, sql, sum } from "drizzle-orm";

import { db } from "~/db";
import {
  albums,
  artists,
  genres,
  playlists,
  tracks,
  tracksToArtists,
  tracksToGenres,
  tracksToPlaylists,
} from "~/db/schema";

import { getSubqueryFields, iAsc } from "~/lib/drizzle";
import { omitKeys, pickKeys } from "~/utils/object";

//#region Track View
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

export type SharedTrackColumn = keyof typeof sharedTrackColumns;
//#endregion

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
    minYear: min(tracks.year).as("min_album_year"),
    maxYear: max(tracks.year).as("max_album_year"),
  })
  .from(albums)
  .innerJoin(tracks, eq(albums.id, tracks.albumId))
  .groupBy(albums.id)
  .orderBy(iAsc(albums.name), iAsc(albums.artistsKey))
  .as("album_lists_view");

//? Used for type inference since we can't directly call `typeof` on an anonymous function.
const _getAlbumLists = async () => db.select().from(albumListsView);
export type AlbumListsResult = Awaited<
  ReturnType<typeof _getAlbumLists>
>[number];
//#endregion

//#region Artist View
export const artistListsView = db
  .select({
    ...getTableColumns(artists),
    duration: sum(tracks.duration).as("total_duration"),
    trackCount: count(tracks.id).as("total_track_count"),
  })
  .from(artists)
  .innerJoin(tracksToArtists, eq(artists.name, tracksToArtists.artistName))
  .innerJoin(tracks, eq(tracksToArtists.trackId, tracks.id))
  .groupBy(artists.name)
  .orderBy(iAsc(artists.name))
  .as("artist_lists_view");
//#endregion

//#region Genre View
export const genreListsView = db
  .select({
    ...getTableColumns(genres),
    duration: sum(tracks.duration).as("total_duration"),
    trackCount: count(tracks.id).as("total_track_count"),
  })
  .from(genres)
  .innerJoin(tracksToGenres, eq(genres.name, tracksToGenres.genreName))
  .innerJoin(tracks, eq(tracksToGenres.trackId, tracks.id))
  .groupBy(genres.name)
  .orderBy(iAsc(genres.name))
  .as("genre_lists_view");
//#endregion

//#region Playlist View
const orderedPlaylistTracksView = db
  .select({
    playlistName: tracksToPlaylists.playlistName,
    position: tracksToPlaylists.position, //? To preserve order.
    id: tracksToPlaylists.trackId,
    duration: structuredTracksView.duration,
    artwork: structuredTracksView.artwork,
  })
  .from(tracksToPlaylists)
  .innerJoin(
    structuredTracksView,
    eq(tracksToPlaylists.trackId, structuredTracksView.id),
  )
  .orderBy(
    iAsc(tracksToPlaylists.playlistName),
    iAsc(tracksToPlaylists.position),
  )
  .as("ordered_playlist_tracks_view");

export const playlistListsView = db
  .select({
    ...getTableColumns(playlists),
    duration: sum(orderedPlaylistTracksView.duration).as("total_duration"),
    trackCount: count(orderedPlaylistTracksView.id).as("total_track_count"),
    /** We need to unencode these strings. */
    collageArtwork: sql<
      string | null
    >`NULLIF(json_group_array(${orderedPlaylistTracksView.artwork}), '[null]')`.as(
      "collage_artwork",
    ),
  })
  .from(playlists)
  .innerJoin(
    orderedPlaylistTracksView,
    eq(playlists.name, orderedPlaylistTracksView.playlistName),
  )
  .groupBy(playlists.name)
  .orderBy(iAsc(playlists.name))
  .as("playlist_lists_view");

//? Used for type inference since we can't directly call `typeof` on an anonymous function.
const _getPlaylistLists = async () => db.select().from(playlistListsView);
export type PlaylistListsResult = Awaited<
  ReturnType<typeof _getPlaylistLists>
>[number];
//#endregion
