import { and, count, eq, getTableColumns, sql, sum } from "drizzle-orm";

import { db } from "~/db";
import { playlists, tracks, tracksToPlaylists } from "~/db/schema";

import i18next from "~/modules/i18n";

import { iAsc, throwIfNoResults } from "~/lib/drizzle";
import { formatSeconds } from "~/utils/number";
import { FavoritesPlaylistKey } from "~/modules/media/constants";
import type { MediaImage } from "~/modules/media/components/MediaImage";
import type { PlaylistSummary, PlaylistSummaryTrack } from "./types";
import { sanitizePlaylistName } from "./utils";
import type { CommonTrack, DrizzleFilter } from "../types";
import { commonTracksOrIds, unencodeJSONArtworkArray } from "../utils";
import { commonTrackColumns, structuredTracksView } from "../views";

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
    getPlaylistTracks(id, false, 4),
  ]);

  let derivedArtwork: MediaImage.ImageSource =
    details.artwork ?? trackArtwork.map((t) => t.artwork);
  if (derivedArtwork.length === 0) derivedArtwork = null;

  return {
    ...details,
    id: details.name,
    name: parsePlaylistName(details.name),
    artwork: derivedArtwork,
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
  const query = db
    .select(onlyIds ? { id: structuredTracksView.id } : commonTrackColumns)
    .from(tracksToPlaylists)
    .where(eq(tracksToPlaylists.playlistName, id))
    .innerJoin(
      structuredTracksView,
      eq(tracksToPlaylists.trackId, structuredTracksView.id),
    )
    .orderBy(iAsc(tracksToPlaylists.position));

  const results = await (limit !== undefined ? query.limit(limit) : query);

  return commonTracksOrIds<CommonTrack, TOnlyIds>(results, onlyIds);
}

/** Get information summarizing each playlist (sorted by names). */
export async function getPlaylistsSummary<
  TWithTracks extends boolean | undefined = false,
>(withTracks?: TWithTracks, conditions?: DrizzleFilter) {
  const orderedPlaylistTracks = db
    .select({
      playlistName: tracksToPlaylists.playlistName,
      position: tracksToPlaylists.position, //? To preserve order.
      id: structuredTracksView.id,
      name: structuredTracksView.name,
      rawArtistName: structuredTracksView.rawArtistName,
      albumName: structuredTracksView.albumName,
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

  const results = await db
    .select({
      ...getTableColumns(playlists),
      duration: sum(orderedPlaylistTracks.duration),
      trackCount: count(orderedPlaylistTracks.id),
      /** We need to unencode these strings. */
      collageArtwork: sql<
        string | null
      >`NULLIF(json_group_array(${orderedPlaylistTracks.artwork}), '[null]')`,
      //! This field is "hacked" in, with the main use for the "JSON Backup" feature.
      ...(withTracks
        ? {
            tracks: sql<string>`
              json_group_array(
                json_object(
                  'id', ${orderedPlaylistTracks.id},
                  'name', ${orderedPlaylistTracks.name},
                  'rawArtistName', ${orderedPlaylistTracks.rawArtistName},
                  'albumName', ${orderedPlaylistTracks.albumName}
                )
              )`.as("grouped_tracks"),
          }
        : {}),
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
    .map(({ collageArtwork, name, tracks, ...playlist }) => ({
      ...playlist,
      id: name,
      name: parsePlaylistName(name),
      artwork: playlist.artwork ?? unencodeJSONArtworkArray(collageArtwork),
      duration: Number(playlist.duration) || 0,
      ...(withTracks ? { tracks: parsePlaylistTracks(tracks) } : {}),
    }))
    .sort((a, b) => a.name.localeCompare(b.name)) as TWithTracks extends true
    ? Array<PlaylistSummary & { tracks: PlaylistSummaryTrack[] }>
    : PlaylistSummary[];
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
/** Checks to see if the playlist name needs to be translated for `FavoritesPlaylistKey`. */
function parsePlaylistName(name: string) {
  return name === FavoritesPlaylistKey
    ? i18next.t("term.favoriteTracks")
    : name;
}

function parsePlaylistTracks(tracks?: string) {
  if (!tracks) return [];
  let results: PlaylistSummaryTrack[] = [];
  try {
    const asArray: any[] = JSON.parse(tracks);
    results = asArray.filter((i) => i.name !== null);
  } catch {}
  return results;
}
//#endregion
