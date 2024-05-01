import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { db } from "@/db";
import type { PlaylistWithTracks } from "@/db/schema";
import {
  getPlaylistCover,
  fixPlaylistJunction,
  formatForCurrentPages,
} from "@/db/utils/formatters";
import { playlistKeys } from "./_queryKeys";

import { pickKeys } from "@/utils/object";

type QueryFnData = PlaylistWithTracks;

export async function getPlaylist({ playlistName }: { playlistName: string }) {
  const currentPlaylist = await db.query.playlists.findFirst({
    where: (fields, { eq }) => eq(fields.name, playlistName),
    with: {
      tracksToPlaylists: {
        columns: {},
        with: { track: { with: { album: true } } },
      },
    },
  });
  if (!currentPlaylist)
    throw new Error(`Playlist ${playlistName} doesn't exist.`);
  return fixPlaylistJunction(currentPlaylist);
}

type UsePlaylistOptions<TData = QueryFnData> = {
  playlistName: string | undefined;
  config?: {
    select?: (data: QueryFnData) => TData;
  };
};

/** @description Returns specified playlist with its tracks. */
export const usePlaylist = <TData = QueryFnData>({
  playlistName,
  config,
}: UsePlaylistOptions<TData>) => {
  const queryClient = useQueryClient();

  return useQuery({
    enabled: Boolean(playlistName),
    queryKey: playlistKeys.detail(playlistName!),
    queryFn: () => getPlaylist({ playlistName: playlistName! }),
    placeholderData: () => {
      return queryClient
        .getQueryData<QueryFnData[]>(playlistKeys.all)
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
export const usePlaylistForCurrentPage = (playlistName: string | undefined) =>
  usePlaylist({
    playlistName,
    config: {
      select: useCallback(
        (data: QueryFnData) => ({
          ...formatForCurrentPages({ type: "playlist", data }),
          imageSource: getPlaylistCover(data),
        }),
        [],
      ),
    },
  });

/** @description Return the most-used data in playlist-related modals. */
export const usePlaylistForModal = (playlistName: string | undefined) =>
  usePlaylist({
    playlistName,
    config: {
      select: useCallback(
        (data: QueryFnData) => ({
          ...pickKeys(data, ["name", "isFavorite"]),
          imageSource: getPlaylistCover(data),
        }),
        [],
      ),
    },
  });
