import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { router } from "expo-router";
import { useSetAtom } from "jotai";
import { useCallback } from "react";

import { db } from "@/db";
import { playlists, tracksToPlaylists } from "@/db/schema";
import { getPlaylist } from "@/db/queries";
import { getPlaylistCover, formatForCurrentPages } from "@/db/utils/formatters";
import { sanitizedPlaylistName } from "@/db/utils/validators";
import { settingKeys } from "@/features/setting/api/_queryKeys";
import { playlistKeys } from "./_queryKeys";
import { favoriteKeys } from "../favorites/_queryKeys";

import { resynchronizeOnAtom } from "@/features/playback/api/synchronize";

import { deleteFile } from "@/lib/file-system";
import { pickKeys } from "@/utils/object";
import type { ExtractFnReturnType, Prettify } from "@/utils/types";

type BaseFnArgs = { playlistName: string };

// ---------------------------------------------------------------------
//                            GET Methods
// ---------------------------------------------------------------------
type GETFnData = ExtractFnReturnType<typeof getPlaylist>;

/** @description Returns specified playlist with its tracks. */
export const playlistOptions = (playlistName: string) =>
  queryOptions({
    queryKey: playlistKeys.detail(playlistName),
    queryFn: () => getPlaylist([eq(playlists.name, playlistName)]),
    staleTime: Infinity,
  });

/**
 * @description Return data to render "MediaList" components on the
 *  `/playlist/[id]` route.
 */
export const usePlaylistForCurrentPage = (playlistName: string) =>
  useQuery({
    ...playlistOptions(playlistName),
    select: useCallback(
      (data: GETFnData) => ({
        ...formatForCurrentPages({ type: "playlist", data }),
        imageSource: getPlaylistCover(data),
      }),
      [],
    ),
  });

/** @description Return the most-used data in playlist-related modals. */
export const usePlaylistForModal = (playlistName: string) =>
  useQuery({
    ...playlistOptions(playlistName),
    select: useCallback(
      (data: GETFnData) => ({
        ...pickKeys(data, ["name", "isFavorite"]),
        imageSource: getPlaylistCover(data),
      }),
      [],
    ),
  });

// ---------------------------------------------------------------------
//                            PATCH Methods
// ---------------------------------------------------------------------
type UPDATEFnAction =
  | { field: "artwork"; value: string | null }
  | { field: "name"; value: string };
type UPDATEFnArgs = Prettify<BaseFnArgs & { action: UPDATEFnAction }>;

export async function updatePlaylist({ playlistName, action }: UPDATEFnArgs) {
  const prevValue = await getPlaylist([eq(playlists.name, playlistName)]);

  if (action.field === "artwork") {
    await deleteFile(prevValue.artwork);
    await db
      .update(playlists)
      .set({ artwork: action.value })
      .where(eq(playlists.name, playlistName));
  } else {
    const sanitizedName = sanitizedPlaylistName(action.value);
    let exists: unknown;
    try {
      exists = await getPlaylist([eq(playlists.name, sanitizedName)]);
    } catch {
      // We know this new playlist name hasn't been used.
      await db.transaction(async (tx) => {
        await tx
          .update(playlists)
          .set({ name: sanitizedName })
          .where(eq(playlists.name, playlistName));
        await tx
          .update(tracksToPlaylists)
          .set({ playlistName: sanitizedName })
          .where(eq(tracksToPlaylists.playlistName, playlistName));
      });
    }
    if (exists) throw new Error("Playlist with name already exists.");
  }

  return { playlistName, action, isFavorite: prevValue.isFavorite };
}

/** @description Update a specific field in a playlist. */
export const useUpdatePlaylist = (playlistName: string) => {
  const queryClient = useQueryClient();
  const resynchronizeFn = useSetAtom(resynchronizeOnAtom);

  return useMutation({
    mutationFn: (action: UPDATEFnAction) =>
      updatePlaylist({ playlistName, action }),
    onSuccess: (result: UPDATEFnArgs & { isFavorite: boolean }) => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.all });
      // Updated playlist in favorites list if exists.
      if (result.isFavorite) {
        queryClient.invalidateQueries({ queryKey: favoriteKeys.lists() });
      }
      // Redirect to new playlist page if we renamed.
      if (result.action.field === "name") {
        const newName = sanitizedPlaylistName(result.action.value);
        // Resynchronize with Jotai.
        resynchronizeFn({
          action: "rename",
          data: {
            old: { type: "playlist", id: playlistName, name: playlistName },
            latest: { type: "playlist", id: newName, name: newName },
          },
        });
        router.replace(`/playlist/${newName}`);
      } else {
        resynchronizeFn({
          action: "update",
          data: { type: "playlist", id: playlistName, name: playlistName },
        });
      }
    },
  });
};

// ---------------------------------------------------------------------
//                            DELETE Methods
// ---------------------------------------------------------------------
export async function deletePlaylist({ playlistName }: BaseFnArgs) {
  return await db.transaction(async (tx) => {
    await tx
      .delete(tracksToPlaylists)
      .where(eq(tracksToPlaylists.playlistName, playlistName));
    const [deletedPlaylist] = await tx
      .delete(playlists)
      .where(eq(playlists.name, playlistName))
      .returning();

    await deleteFile(deletedPlaylist!.artwork);

    return deletedPlaylist!.isFavorite;
  });
}

/** @description Delete specified playlist. */
export const useDeletePlaylist = (playlistName: string) => {
  const queryClient = useQueryClient();
  const resynchronizeFn = useSetAtom(resynchronizeOnAtom);

  return useMutation({
    mutationFn: () => deletePlaylist({ playlistName }),
    onSuccess: (wasFavorited: boolean) => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.all });
      queryClient.invalidateQueries({ queryKey: settingKeys.storage() });
      // Remove from favorites list if it was favorited.
      if (wasFavorited) {
        queryClient.invalidateQueries({ queryKey: favoriteKeys.lists() });
      }
      // Resynchronize with Jotai.
      resynchronizeFn({
        action: "delete",
        data: { type: "playlist", id: playlistName, name: playlistName },
      });
      // Go back a page as this current page (deleted playlist) isn't valid.
      router.back();
    },
  });
};
