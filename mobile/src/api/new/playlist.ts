import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import type { PlaylistWithJunction, PlaylistWithTracks } from "@/db/schema";
import { playlists, tracksToPlaylists } from "@/db/schema";
import { sanitizedPlaylistName } from "@/db/utils/validators";

import i18next from "@/modules/i18n";

import { deleteFile } from "@/lib/file-system";
import type {
  DrizzleFilter,
  FavoriteArgs,
  QueryCondition,
  QueryMultiple,
  QuerySingleFn,
} from "./types";

//#region GET Methods
/** Get the specified playlist. Throws error by default if no playlist is found. */
// @ts-expect-error - Function overloading typing issues [ts(2322)]
export const getPlaylist: QuerySingleFn<PlaylistWithTracks> = async ({
  shouldThrow = true,
  ...opts
}) => {
  let conditions: DrizzleFilter = opts.filters ?? [];
  if (opts.id) conditions.push(eq(playlists.name, opts.id));
  const playlist = await db.query.playlists.findFirst({
    where: and(...conditions),
    with: {
      tracksToPlaylists: {
        columns: {},
        with: { track: { with: { album: true } } },
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
export async function getPlaylists(args?: QueryMultiple) {
  const allPlaylists = await db.query.playlists.findMany({
    where: and(...(args?.filters ?? [])),
    with: {
      tracksToPlaylists: {
        columns: {},
        with: { track: { with: { album: true } } },
      },
    },
  });
  return allPlaylists.map((data) => fixPlaylistJunction(data));
}
//#endregion

//#region POST Methods
/** Create a new playlist entry. */
export async function createPlaylist(
  playlistEntry: typeof playlists.$inferInsert,
) {
  const { name, ...rest } = playlistEntry;
  return db
    .insert(playlists)
    .values({ ...rest, name: sanitizedPlaylistName(name) })
    .onConflictDoNothing();
}
//#endregion

//#region PATCH Methods
/** Update the `favorite` status of a playlist. */
export async function favoritePlaylist({ isFavorite, ...args }: FavoriteArgs) {
  return updatePlaylist({ ...args, set: { isFavorite } });
}

/** Update specified playlist. */
export async function updatePlaylist(
  args: QueryCondition & { set: Partial<typeof playlists.$inferInsert> },
) {
  let conditions: DrizzleFilter = args.filters ?? [];
  if (args.id) conditions.push(eq(playlists.name, args.id));

  const oldValue = await getPlaylist(args);
  const { name, ...rest } = args.set;
  let sanitizedName = name ? sanitizedPlaylistName(name) : undefined;
  return db.transaction(async (tx) => {
    try {
      await tx
        .update(playlists)
        .set({ ...rest, name: sanitizedName })
        .where(and(...conditions));
    } catch {
      // If we tried to change the playlist name that's already in use.
      throw new Error(i18next.t("response.usedName"));
    }
    // Ensure track relationship is preserved.
    if (sanitizedName !== undefined) {
      await tx
        .update(tracksToPlaylists)
        .set({ playlistName: sanitizedName })
        .where(eq(tracksToPlaylists.playlistName, oldValue.name));
    }
    // Delete the old artwork if we changed it.
    if (!!rest.artwork) await deleteFile(oldValue.artwork);
  });
}
//#endregion

//#region DELETE Methods
/** Delete specified playlist. */
export async function deletePlaylist(args: QueryCondition) {
  let conditions: DrizzleFilter = args.filters ?? [];
  if (args.id) conditions.push(eq(playlists.name, args.id));
  return db.transaction(async (tx) => {
    const playlistToDelete = await getPlaylists({ filters: conditions });
    // Delete each playlist and their track relations.
    for (const playlist of playlistToDelete) {
      await tx
        .delete(tracksToPlaylists)
        .where(eq(tracksToPlaylists.playlistName, playlist.name));
      await tx.delete(playlists).where(eq(playlists.name, playlist.name));
    }
    // If the deletions were fine, delete the artworks.
    for (const { artwork } of playlistToDelete) {
      await deleteFile(artwork);
    }
  });
}
//#endregion

//#region Utils
/** Replace the "junction" field from the `Playlist` table with `tracks`. */
function fixPlaylistJunction(data: PlaylistWithJunction): PlaylistWithTracks {
  const { tracksToPlaylists, ...rest } = data;
  return { ...rest, tracks: tracksToPlaylists.map(({ track }) => track) };
}
//#endregion
