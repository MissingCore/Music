import { and, eq } from "drizzle-orm";

import { db } from "~/db";
import type {
  Playlist,
  PlaylistWithJunction,
  PlaylistWithTracks,
  TrackWithAlbum,
} from "~/db/schema";
import { playlists, tracksToPlaylists } from "~/db/schema";
import { sanitizePlaylistName } from "~/db/utils";

import i18next from "~/modules/i18n";
import { sortPreferencesStore } from "~/modules/media/services/SortPreferences";

import { iAsc, iDesc } from "~/lib/drizzle";
import { moveArray, pickKeys } from "~/utils/object";
import type { ReservedPlaylistName } from "~/modules/media/constants";
import { ReservedPlaylists } from "~/modules/media/constants";
import type { QueryManyWithTracksFn, QueryOneWithTracksFn } from "./types";
import { getColumns, withAlbum } from "./utils";

//#region GET Methods
const _getPlaylist: QueryOneWithTracksFn<Playlist> =
  () => async (id, options) => {
    const playlist = await db.query.playlists.findFirst({
      where: eq(playlists.name, id),
      columns: getColumns(options?.columns),
      with: {
        // Note: `where` only works on the 1st "with" block.
        tracksToPlaylists: {
          columns: {},
          with: {
            track: {
              // Note: If columns are provided, ensure `hiddenAt` is included.
              columns: getColumns(
                options?.trackColumns
                  ? [...options.trackColumns, "hiddenAt"]
                  : undefined,
              ),
              ...withAlbum({ defaultWithAlbum: true, ...options }),
            },
          },
          orderBy: (fields, { asc }) => asc(fields.position),
        },
      },
    });
    if (!playlist) throw new Error(i18next.t("err.msg.noPlaylists"));
    return fixPlaylistJunction(playlist);
  };

/**
 * Get specified playlist. Throws error if nothing is found.
 *
 * **Note:** Do not use the `withTracks` option with this function.
 */
export const getPlaylist = _getPlaylist();

const _getPlaylists: QueryManyWithTracksFn<Playlist> =
  () => async (options) => {
    const allPlaylists = await db.query.playlists.findMany({
      where: and(...(options?.where ?? [])),
      columns: getColumns(options?.columns),
      with: {
        // Note: `where` only works on the 1st "with" block.
        tracksToPlaylists: {
          columns: {},
          with: {
            track: {
              // Note: If columns are provided, ensure `hiddenAt` is included.
              columns: getColumns(
                options?.trackColumns
                  ? [...options.trackColumns, "hiddenAt"]
                  : undefined,
              ),
              ...withAlbum({ defaultWithAlbum: true, ...options }),
            },
          },
          orderBy: (fields, { asc }) => asc(fields.position),
        },
      },
      orderBy: (fields) => iAsc(fields.name),
    });
    return allPlaylists.map((data) => fixPlaylistJunction(data));
  };

/**
 * Get multiple playlists.
 *
 * **Note:** Do not use the `withTracks` option with this function.
 */
export const getPlaylists = _getPlaylists();

const _getSpecialPlaylist: QueryOneWithTracksFn<
  Playlist,
  true,
  ReservedPlaylistName
> = () => async (id, options) => {
  let mainFields = { name: id, artwork: id, isFavorite: false };
  // @ts-expect-error - `mainFields` should match based on `options.columns`.
  if (options?.columns) mainFields = pickKeys(mainFields, options.columns);

  // FIXME: Sorting is handling in the SQL instead of the `sortTracks()` function.
  const { isAsc, orderedBy } = sortPreferencesStore.getState();
  const playlistTracks = await db.query.tracks.findMany({
    columns: getColumns(options?.trackColumns),
    ...withAlbum({ defaultWithAlbum: true, ...options }),
    ...(ReservedPlaylists.favorites === id
      ? {
          where: (fields, { and, eq, isNull }) =>
            and(eq(fields.isFavorite, true), isNull(fields.hiddenAt)),
          orderBy: (fields) => iAsc(fields.name),
        }
      : {
          where: (fields, { isNull }) => isNull(fields.hiddenAt),
          orderBy: (fields) =>
            isAsc
              ? iAsc(
                  orderedBy === "alphabetical"
                    ? fields.name
                    : orderedBy === "discover"
                      ? fields.discoverTime
                      : fields.modificationTime,
                )
              : iDesc(
                  orderedBy === "alphabetical"
                    ? fields.name
                    : orderedBy === "discover"
                      ? fields.discoverTime
                      : fields.modificationTime,
                ),
        }),
  });

  return { ...mainFields, tracks: playlistTracks };
};

/**
 * Get one of the "reserved" playlists. Tracks are sorted.
 *
 * **Note:** Do not use the `withTracks` option with this function.
 */
export const getSpecialPlaylist = _getSpecialPlaylist();
//#endregion

//#region POST Methods
/** Create a new playlist entry. */
export async function createPlaylist(
  entry: typeof playlists.$inferInsert & { tracks?: Array<{ id: string }> },
) {
  const { tracks, name, ...newPlaylist } = entry;
  const playlistName = sanitizePlaylistName(name);
  return db.transaction(async (tx) => {
    await tx
      .insert(playlists)
      .values({ ...newPlaylist, name: playlistName })
      .onConflictDoNothing();

    // Create track relations with playlist if provided.
    if (tracks && tracks.length > 0) {
      await tx.insert(tracksToPlaylists).values(
        tracks.map((t, position) => {
          return { trackId: t.id, playlistName, position };
        }),
      );
    }
  });
}
//#endregion

//#region PATCH Methods
/** Update the `favorite` status of a playlist. */
export async function favoritePlaylist(id: string, isFavorite: boolean) {
  return updatePlaylist(id, { isFavorite });
}

/** Move a track in a playlist. */
export async function moveInPlaylist(info: {
  playlistName: string;
  fromIndex: number;
  toIndex: number;
}) {
  return db.transaction(async (tx) => {
    const tracksInPlaylist = await tx
      .delete(tracksToPlaylists)
      .where(eq(tracksToPlaylists.playlistName, info.playlistName))
      .returning();
    await tx.insert(tracksToPlaylists).values(
      moveArray(
        tracksInPlaylist.sort((a, b) => a.position - b.position),
        { fromIndex: info.fromIndex, toIndex: info.toIndex },
      ).map((t, position) => {
        t.position = position;
        return t;
      }),
    );
  });
}

/** Update specified playlist. */
export async function updatePlaylist(
  id: string,
  values: Partial<typeof playlists.$inferInsert> & {
    tracks?: Array<{ id: string }>;
  },
) {
  const { tracks, name, ...rest } = values;
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
    // Ensure track relationship is preserved.
    if (tracks) {
      await tx
        .delete(tracksToPlaylists)
        .where(eq(tracksToPlaylists.playlistName, id));
      // Add relations if necessary (`tracks = []` means the playlist has no tracks).
      if (tracks.length > 0) {
        await tx.insert(tracksToPlaylists).values(
          tracks.map((t, position) => {
            const usedName = sanitizedName ?? id;
            return { trackId: t.id, playlistName: usedName, position };
          }),
        );
      }
    } else if (!!sanitizedName) {
      // Otherwise, the playlist name was changed.
      await tx
        .update(tracksToPlaylists)
        .set({ playlistName: sanitizedName })
        .where(eq(tracksToPlaylists.playlistName, id));
    }
  });
}
//#endregion

//#region DELETE Methods
/** Delete specified playlist. */
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
/** Replace the "junction" field from the `Playlist` table with `tracks`. */
function fixPlaylistJunction(data: PlaylistWithJunction): PlaylistWithTracks {
  const { tracksToPlaylists, ...rest } = data;
  return {
    ...rest,
    // Note: We do the filter in the case where we attempted to delete a track,
    // but failed to do so (resulting in an invalid track floating around).
    tracks: tracksToPlaylists
      .map(({ track }) => track)
      .filter((t) => t !== null && t.hiddenAt === null)
      .map(({ hiddenAt: _, ...t }) => t) as TrackWithAlbum[],
  };
}
//#endregion
