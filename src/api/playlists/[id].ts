import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { router } from "expo-router";
import { useCallback } from "react";

import { db } from "@/db";
import type { PlaylistWithTracks } from "@/db/schema";
import { playlists, tracksToPlaylists } from "@/db/schema";
import {
  getPlaylistCover,
  fixPlaylistJunction,
  formatForCurrentPages,
} from "@/db/utils/formatters";
import { sanitizedPlaylistName } from "@/db/utils/validators";
import { playlistKeys } from "./_queryKeys";
import { favoriteKeys } from "../favorites/_queryKeys";

import { deleteFile } from "@/lib/file-system";
import { pickKeys } from "@/utils/object";
import type { Prettify } from "@/utils/types";

type BaseFnArgs = { playlistName: string };

// ---------------------------------------------------------------------
//                            GET Methods
// ---------------------------------------------------------------------
type GETFnData = PlaylistWithTracks;

export async function getPlaylist({ playlistName }: BaseFnArgs) {
  const currentPlaylist = await db.query.playlists.findFirst({
    where: (fields, { eq }) => eq(fields.name, playlistName),
    with: {
      tracksToPlaylists: {
        columns: {},
        with: { track: { with: { album: true } } },
      },
    },
  });
  if (!currentPlaylist) {
    throw new Error(`Playlist ${playlistName} doesn't exist.`);
  }
  return fixPlaylistJunction(currentPlaylist);
}

type UsePlaylistOptions<TData = GETFnData> = Prettify<
  BaseFnArgs & {
    config?: {
      select?: (data: GETFnData) => TData;
    };
  }
>;

/** @description Returns specified playlist with its tracks. */
export const usePlaylist = <TData = GETFnData>({
  playlistName,
  config,
}: UsePlaylistOptions<TData>) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: playlistKeys.detail(playlistName),
    queryFn: () => getPlaylist({ playlistName }),
    placeholderData: () => {
      return queryClient
        .getQueryData<GETFnData[]>(playlistKeys.all)
        ?.find((d) => d?.name === playlistName);
    },
    staleTime: Infinity,
    ...config,
  });
};

/**
 * @description Return data to render "MediaList" components on the
 *  `/playlist/[id]` route.
 */
export const usePlaylistForCurrentPage = (playlistName: string) =>
  usePlaylist({
    playlistName,
    config: {
      select: useCallback(
        (data: GETFnData) => ({
          ...formatForCurrentPages({ type: "playlist", data }),
          imageSource: getPlaylistCover(data),
        }),
        [],
      ),
    },
  });

/** @description Return the most-used data in playlist-related modals. */
export const usePlaylistForModal = (playlistName: string) =>
  usePlaylist({
    playlistName,
    config: {
      select: useCallback(
        (data: GETFnData) => ({
          ...pickKeys(data, ["name", "isFavorite"]),
          imageSource: getPlaylistCover(data),
        }),
        [],
      ),
    },
  });

// ---------------------------------------------------------------------
//                            PATCH Methods
// ---------------------------------------------------------------------
type UPDATEFnAction =
  | { field: "coverSrc"; value: string | null }
  | { field: "name"; value: string };
type UPDATEFnArgs = Prettify<BaseFnArgs & { action: UPDATEFnAction }>;

export async function updatePlaylist({ playlistName, action }: UPDATEFnArgs) {
  const currentPlaylist = await db.query.playlists.findFirst({
    where: (fields, { eq }) => eq(fields.name, playlistName),
  });
  if (!currentPlaylist) {
    throw new Error(`Playlist ${playlistName} doesn't exist.`);
  }

  if (action.field === "coverSrc") {
    await deleteFile(currentPlaylist.coverSrc);
    await db
      .update(playlists)
      .set({ coverSrc: action.value })
      .where(eq(playlists.name, playlistName));
  } else {
    const sanitizedName = sanitizedPlaylistName(action.value);

    const exists = await db.query.playlists.findFirst({
      where: (fields, { eq }) => eq(fields.name, sanitizedName),
    });
    if (exists) {
      throw new Error(`Playlist with name ${sanitizedName} already exists.`);
    }

    await db
      .update(playlists)
      .set({ name: sanitizedName })
      .where(eq(playlists.name, playlistName));
    await db
      .update(tracksToPlaylists)
      .set({ playlistName: sanitizedName })
      .where(eq(tracksToPlaylists.playlistName, playlistName));
  }

  return { playlistName, action, isFavorite: currentPlaylist.isFavorite };
}

/** @description Update a specific field in a playlist. */
export const useUpdatePlaylist = (playlistName: string) => {
  const queryClient = useQueryClient();

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
        router.replace(`/playlist/${result.action.value}`);
      }
    },
  });
};

// ---------------------------------------------------------------------
//                            DELETE Methods
// ---------------------------------------------------------------------
export async function deletePlaylist({ playlistName }: BaseFnArgs) {
  await db
    .delete(tracksToPlaylists)
    .where(eq(tracksToPlaylists.playlistName, playlistName));
  const [deletedPlaylist] = await db
    .delete(playlists)
    .where(eq(playlists.name, playlistName))
    .returning();

  await deleteFile(deletedPlaylist.coverSrc);

  return deletedPlaylist.isFavorite;
}

/** @description Delete specified playlist. */
export const useDeletePlaylist = (playlistName: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deletePlaylist({ playlistName }),
    onSuccess: (wasFavorited: boolean) => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.all });
      // Remove from favorites list if it was favorited.
      if (wasFavorited) {
        queryClient.invalidateQueries({ queryKey: favoriteKeys.lists() });
      }
      // Go back a page as this current page (deleted playlist) isn't valid.
      router.back();
    },
  });
};
