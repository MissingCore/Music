import { and, count, eq, getTableColumns, sql, sum } from "drizzle-orm";

import { db } from "~/db";
import { albums, playlists, tracks, tracksToPlaylists } from "~/db/schema";

import i18next from "~/modules/i18n";

import { iAsc, throwIfNoResults } from "~/lib/drizzle";
import { formatSeconds } from "~/utils/number";
import { FavoritesPlaylistKey } from "~/modules/media/constants";

import type { PlaylistTrack } from "./types";
import { sanitizePlaylistName } from "./utils";
import type { DrizzleFilter } from "../types";
import { unencodeJSONArray, unencodeJSONArtworkArray } from "../utils";
import { getOrderedTrackArtistsView } from "../views";

type InsertedPlaylist = typeof playlists.$inferInsert;

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

export async function getPlaylists(conditions?: DrizzleFilter) {
  const orderedPlaylistTracks = getOrderedPlaylistTracksView();

  const results = await db
    .select({
      name: playlists.name,
      groupedTracks: sql<string>`
        json_group_array(
          json_object(
            'id', ${orderedPlaylistTracks.id},
            'name', ${orderedPlaylistTracks.name},
            'rawArtistName', ${orderedPlaylistTracks.rawArtistName},
            'album', ${orderedPlaylistTracks.album}
          )
        )`.as("grouped_tracks"),
    })
    .from(playlists)
    .where(and(...(conditions ?? [])))
    //? We use `leftJoin` instead of `innerJoin` as we want empty playlists.
    .leftJoin(
      orderedPlaylistTracks,
      eq(playlists.name, orderedPlaylistTracks.playlistName),
    )
    .groupBy(playlists.name)
    .orderBy(iAsc(playlists.name));

  return results
    .map(({ name, groupedTracks }) => {
      let parsedResults: Array<{
        id: string;
        name: string;
        rawArtistName: string | null;
        album: string | null;
      }> = [];
      try {
        const asArray: any[] = JSON.parse(groupedTracks);
        parsedResults = asArray.filter(
          (i) => i.name !== null && i.artistName !== null && i.album !== null,
        );
      } catch {}

      return {
        id: name,
        name:
          name === FavoritesPlaylistKey
            ? i18next.t("term.favoriteTracks")
            : name,
        tracks: parsedResults,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Get information summarizing each playlist (sorted by names). */
export async function getPlaylistsSummary(conditions?: DrizzleFilter) {
  const orderedPlaylistTracks = getOrderedPlaylistTracksView();

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
    //? We use `leftJoin` instead of `innerJoin` as we want empty playlists.
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

//#region POST Methods
export async function createPlaylist(entry: {
  name: string;
  tracks?: Array<{ id: string }>;
}) {
  const name = sanitizePlaylistName(entry.name);
  return db.transaction(async (tx) => {
    await tx.insert(playlists).values({ name }).onConflictDoNothing();
    // Create playlist-track relations.
    if (entry.tracks && entry.tracks.length > 0) {
      await tx.insert(tracksToPlaylists).values(
        entry.tracks.map((t, position) => {
          return { playlistName: name, trackId: t.id, position };
        }),
      );
    }
  });
}
//#endregion

//#region PATCH Methods
export async function updatePlaylist(
  id: string,
  values: Partial<InsertedPlaylist> & { tracks?: Array<{ id: string }> },
) {
  const { name, tracks, ...rest } = values;
  const sanitizedName = name ? sanitizePlaylistName(name) : undefined;
  return db.transaction(async (tx) => {
    try {
      await tx
        .update(playlists)
        .set({ ...rest, name: sanitizedName })
        .where(eq(playlists.name, id));
    } catch (err) {
      if (!(err as Error).message.includes("No values to set")) {
        // If we tried to change the playlist name that's already in use.
        throw new Error(i18next.t("err.msg.usedName"));
      }
    }

    // Handle playlist-track relations.
    if (tracks) {
      await tx
        .delete(tracksToPlaylists)
        .where(eq(tracksToPlaylists.playlistName, id));
      // Re-add relations if they exist.
      if (tracks.length > 0) {
        await tx.insert(tracksToPlaylists).values(
          tracks.map((t, position) => {
            const latestName = sanitizedName ?? id; // Use updated name if that got changed.
            return { playlistName: latestName, trackId: t.id, position };
          }),
        );
      }
    } else if (sanitizedName !== undefined) {
      // If the playlist name has changed, update the relations.
      await tx
        .update(tracksToPlaylists)
        .set({ playlistName: sanitizedName })
        .where(eq(tracksToPlaylists.playlistName, id));
    }
  });
}
//#endregion

//#region DELETE Methods
export async function deletePlaylist(id: string) {
  return db.transaction(async (tx) => {
    await tx
      .delete(tracksToPlaylists)
      .where(eq(tracksToPlaylists.playlistName, id));
    await tx.delete(playlists).where(eq(playlists.name, id));
  });
}
//#endregion

//#region Internal Utils
function getOrderedPlaylistTracksView() {
  return db
    .select({
      playlistName: tracksToPlaylists.playlistName,
      position: tracksToPlaylists.position, //? To preserve order.
      id: tracks.id,
      name: tracks.name,
      rawArtistName: tracks.rawArtistName,
      //? For some weird reason, using `albums.name` directly returns `tracks.name`.
      album: sql<string>`${albums.name}`.as("album"),
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
    .as("ordered_playlist_tracks_view");
}
//#endregion
