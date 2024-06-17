import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";

import { db } from "@/db";
import { playlists } from "@/db/schema";
import { getPlaylists } from "@/db/queries";
import { formatForMediaCard } from "@/db/utils/formatters";
import { sanitizedPlaylistName } from "@/db/utils/validators";
import { playlistKeys } from "./_queryKeys";

import type { ExtractFnReturnType } from "@/utils/types";

type BaseFnArgs = { playlistName: string };

// ---------------------------------------------------------------------
//                            GET Methods
// ---------------------------------------------------------------------
type GETFnData = ExtractFnReturnType<typeof getPlaylists>;

/** @description Returns all playlists with its tracks. */
export const playlistsOptions = () =>
  queryOptions({
    queryKey: playlistKeys.all,
    queryFn: () => getPlaylists(),
    staleTime: Infinity,
  });

/** @description Returns a list of `MediaCardContent` generated from playlists. */
export const usePlaylistsForMediaCard = () =>
  useQuery({
    ...playlistsOptions(),
    select: useCallback(
      (data: GETFnData) =>
        data
          .map((playlist) =>
            formatForMediaCard({ type: "playlist", data: playlist }),
          )
          .sort((a, b) => a.title.localeCompare(b.title)),
      [],
    ),
  });

/** @description Return the most-used data in playlist-related modals. */
export const usePlaylistsForModal = () =>
  useQuery({
    ...playlistsOptions(),
    select: useCallback(
      (data: GETFnData) =>
        data
          .map(({ name, tracks }) => ({ name, trackCount: tracks.length }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      [],
    ),
  });

// ---------------------------------------------------------------------
//                              POST Methods
// ---------------------------------------------------------------------
export async function createPlaylist({ playlistName }: BaseFnArgs) {
  await db
    .insert(playlists)
    .values({ name: sanitizedPlaylistName(playlistName) })
    .onConflictDoNothing();
}

/** @description Create a new playlist entry. */
export const useCreatePlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (playlistName: string) => createPlaylist({ playlistName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.all });
    },
  });
};
