import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import type {
  PlaylistWithJunction,
  PlaylistWithTracks,
  TrackWithAlbum,
} from "@/db/schema";
import { playlists, tracksToPlaylists } from "@/db/schema";
import { sanitizePlaylistName } from "@/db/utils";

import i18next from "@/modules/i18n";
import { sortTracks } from "@/modules/media/services/SortPreferences";

import { iAsc } from "@/lib/drizzle";
import { deleteImage } from "@/lib/file-system";
import type { ReservedPlaylistName } from "@/modules/media/constants";
import { ReservedPlaylists } from "@/modules/media/constants";
import type { DrizzleFilter, QuerySingleFn } from "./types";

//#region GET Methods
/** Get specified playlist. Throws error by default if nothing is found. */
// @ts-expect-error - Function overloading typing issues [ts(2322)]
export const getPlaylist: QuerySingleFn<PlaylistWithTracks> = async (
  id,
  shouldThrow = true,
) => {
  const playlist = await db.query.playlists.findFirst({
    where: eq(playlists.name, id),
    with: {
      tracksToPlaylists: {
        columns: {},
        with: { track: { with: { album: true } } },
        orderBy: (fields, { asc }) => asc(fields.position),
      },
    },
  });
  if (!playlist) {
    if (shouldThrow) throw new Error(i18next.t("response.noPlaylists"));
    return undefined;
  }
  return fixPlaylistJunction(playlist);
};

/** Get multiple playlists. */
export async function getPlaylists(where: DrizzleFilter = []) {
  const allPlaylists = await db.query.playlists.findMany({
    where: and(...where),
    with: {
      tracksToPlaylists: {
        columns: {},
        with: { track: { with: { album: true } } },
        orderBy: (fields, { asc }) => asc(fields.position),
      },
    },
    orderBy: (fields) => iAsc(fields.name),
  });
  return allPlaylists.map((data) => fixPlaylistJunction(data));
}

/** Get one of the "reserved" playlists. Tracks are unsorted. */
export async function getSpecialPlaylist(id: ReservedPlaylistName) {
  const isFavoriteList = ReservedPlaylists.favorites === id;
  const playlistTracks = await db.query.tracks.findMany({
    with: { album: true },
    ...(isFavoriteList
      ? {
          where: (fields, { eq }) => eq(fields.isFavorite, true),
          orderBy: (fields) => iAsc(fields.name),
        }
      : {}),
  });

  let sortedTracks = playlistTracks;
  if (!isFavoriteList) sortedTracks = sortTracks(playlistTracks);

  return { name: id, artwork: id, isFavorite: false, tracks: sortedTracks };
}
//#endregion

//#region POST Methods
/** Create a new playlist entry. */
export async function createPlaylist(
  entry: typeof playlists.$inferInsert & { tracks?: TrackWithAlbum[] },
) {
  return db.transaction(async (tx) => {
    const { tracks, name, ...newPlaylist } = entry;
    const playlistName = sanitizePlaylistName(name);
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

    const copy = [...tracksInPlaylist].sort((a, b) => a.position - b.position);
    const moved = copy.splice(info.fromIndex, 1);
    await tx
      .insert(tracksToPlaylists)
      .values(
        copy
          .toSpliced(info.toIndex, 0, moved[0]!)
          .map((t, position) => ({ ...t, position })),
      );
  });
}

/** Update specified playlist. */
export async function updatePlaylist(
  id: string,
  values: Partial<typeof playlists.$inferInsert> & {
    tracks?: TrackWithAlbum[];
  },
) {
  const oldValue = await getPlaylist(id);
  const { tracks, name, ...rest } = values;
  let sanitizedName = name ? sanitizePlaylistName(name) : undefined;
  return db.transaction(async (tx) => {
    try {
      await tx
        .update(playlists)
        .set({ ...rest, name: sanitizedName })
        .where(eq(playlists.name, id));
    } catch (err) {
      if (!(err as Error).message.includes("No values to set")) {
        // If we tried to change the playlist name that's already in use.
        throw new Error(i18next.t("response.usedName"));
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
    // Delete the old artwork if we changed it (`null` means we've removed it).
    if (rest.artwork !== undefined) await deleteImage(oldValue.artwork);
  });
}
//#endregion

//#region DELETE Methods
/** Delete specified playlist. */
export async function deletePlaylist(id: string) {
  return db.transaction(async (tx) => {
    const { artwork } = await getPlaylist(id);
    // Delete playlist and its track relations.
    await tx
      .delete(tracksToPlaylists)
      .where(eq(tracksToPlaylists.playlistName, id));
    await tx.delete(playlists).where(eq(playlists.name, id));
    // If the deletions were fine, delete the artwork.
    await deleteImage(artwork);
  });
}
//#endregion

//#region Internal Utils
/** Replace the "junction" field from the `Playlist` table with `tracks`. */
function fixPlaylistJunction(data: PlaylistWithJunction): PlaylistWithTracks {
  const { tracksToPlaylists, ...rest } = data;
  return { ...rest, tracks: tracksToPlaylists.map(({ track }) => track) };
}
//#endregion
