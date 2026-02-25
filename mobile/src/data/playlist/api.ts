import { and, count, eq, getTableColumns, sql, sum } from "drizzle-orm";

import { db } from "~/db";
import { albums, playlists, tracks, tracksToPlaylists } from "~/db/schema";

import i18next from "~/modules/i18n";

import { iAsc, throwIfNoResults } from "~/lib/drizzle";
import { formatSeconds } from "~/utils/number";
import { FavoritesPlaylistKey } from "~/modules/media/constants";

import type { PlaylistTrack } from "./types";
import type { DrizzleFilter } from "../types";
import { unencodeJSONArray, unencodeJSONArtworkArray } from "../utils";
import { getOrderedTrackArtistsView } from "../views";

//#region GET Methods
/** Get all data associated with a playlist. */
export async function getPlaylist<TOnlyIds extends boolean | undefined = false>(
  id: string,
  onlyIds?: TOnlyIds,
) {
  const [playlistDetails, playlistTracks] = await Promise.all([
    getPlaylistDetails(id),
    getPlaylistTracks(id, onlyIds),
  ]);

  return { ...playlistDetails, tracks: playlistTracks };
}

/** Get the playlist object along with its derived artwork. */
export async function getPlaylistDetails(id: string) {
  const [details, [agg], trackArtwork] = await Promise.all([
    throwIfNoResults(
      db.query.playlists.findFirst({ where: eq(playlists.name, id) }),
      "err.msg.noPlaylists",
    ),
    db
      .select({ duration: sum(tracks.duration) })
      .from(tracksToPlaylists)
      .where(eq(tracksToPlaylists.playlistName, id))
      .innerJoin(tracks, eq(tracksToPlaylists.trackId, tracks.id)),
    getPlaylistTracks(id, undefined, 4),
  ]);

  return {
    ...details,
    id: details.name,
    name:
      details.name === FavoritesPlaylistKey
        ? i18next.t("term.favoriteTracks")
        : details.name,
    artwork: details.artwork ?? trackArtwork.map((t) => t.artwork),
    duration: formatSeconds(agg?.duration ? +agg.duration : 0),
  };
}

/**
 * Return the tracks associated with a playlist. It's not guaranteed that
 * the playlist exists.
 */
export async function getPlaylistTracks<
  TOnlyIds extends boolean | undefined = false,
>(id: string, onlyIds?: TOnlyIds, limit?: number) {
  const orderedTrackArtists = getOrderedTrackArtistsView();

  const query = db
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
            uri: tracks.uri,
            /** We need to unencode these fields. */
            artists: sql<string>`json_group_array(${orderedTrackArtists.artistName})`,
          },
    )
    .from(tracksToPlaylists)
    .where(eq(tracksToPlaylists.playlistName, id))
    .innerJoin(tracks, eq(tracksToPlaylists.trackId, tracks.id))
    .leftJoin(albums, eq(tracks.albumId, albums.id))
    .leftJoin(orderedTrackArtists, eq(tracks.id, orderedTrackArtists.trackId))
    .groupBy(tracksToPlaylists.trackId)
    .orderBy(iAsc(tracksToPlaylists.position));

  const results = await (limit !== undefined ? query.limit(limit) : query);

  return (
    onlyIds
      ? results
      : results.map(({ artists, ...rest }) => ({
          ...rest,
          artists: unencodeJSONArray(artists as string),
        }))
  ) as TOnlyIds extends true ? Array<{ id: string }> : PlaylistTrack[];
}

/** Get information summarizing each playlist (sorted by names). */
export async function getPlaylistsSummary(conditions?: DrizzleFilter) {
  const orderedPlaylistTracks = db
    .select({
      playlistName: tracksToPlaylists.playlistName,
      position: tracksToPlaylists.position, //? To preserve order.
      id: tracks.id,
      duration: tracks.duration,
      derivedArtwork: sql<
        string | null
      >`coalesce(${tracks.artwork}, ${albums.artwork})`.as("derived_artwork"),
    })
    .from(tracksToPlaylists)
    .innerJoin(tracks, eq(tracksToPlaylists.trackId, tracks.id))
    .leftJoin(albums, eq(tracks.albumId, albums.id))
    .orderBy(
      iAsc(tracksToPlaylists.playlistName),
      iAsc(tracksToPlaylists.position),
    )
    .as("ordered_playlist_tracks");

  const results = await db
    .select({
      ...getTableColumns(playlists),
      duration: sum(orderedPlaylistTracks.duration),
      trackCount: count(orderedPlaylistTracks.id),
      /** We need to unencode this string. */
      collageArtwork: sql<string>`json_group_array(${orderedPlaylistTracks.derivedArtwork})`,
    })
    .from(playlists)
    .where(and(...(conditions ?? [])))
    .leftJoin(
      orderedPlaylistTracks,
      eq(playlists.name, orderedPlaylistTracks.playlistName),
    )
    .groupBy(playlists.name)
    .orderBy(iAsc(playlists.name));

  return results
    .map(({ collageArtwork, name, ...playlist }) => ({
      ...playlist,
      id: name,
      name:
        name === FavoritesPlaylistKey ? i18next.t("term.favoriteTracks") : name,
      artwork:
        playlist.artwork ??
        unencodeJSONArtworkArray(collageArtwork, playlist.trackCount === 0),
      duration: Number(playlist.duration) || 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
//#endregion
