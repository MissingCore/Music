import { eq, sql, sum } from "drizzle-orm";

import { db } from "~/db";
import { albums, playlists, tracks, tracksToPlaylists } from "~/db/schema";

import { iAsc, throwIfNoResults } from "~/lib/drizzle";
import { formatSeconds } from "~/utils/number";
import type { PlaylistTrack } from "./types";
import { unencodeJSONArray } from "../utils";
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

  const artwork = details.artwork ?? trackArtwork.map((t) => t.artwork);
  const duration = formatSeconds(agg?.duration ? +agg.duration : 0);

  return { ...details, artwork, duration };
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
            album: albums.name,
            artwork: sql<
              string | null
            >`coalesce(${tracks.artwork}, ${albums.artwork})`.as(
              "derived_artwork",
            ),
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
//#endregion
