import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { db } from "@/db";
import type { PlaylistWithTracks } from "@/db/schema";
import { playlists } from "@/db/schema";
import { fixPlaylistJunction, formatForMediaCard } from "@/db/utils/formatters";
import { sanitizedPlaylistName } from "@/db/utils/validators";
import { playlistKeys } from "./_queryKeys";

type BaseFnArgs = { playlistName: string };

// ---------------------------------------------------------------------
//                            GET Methods
// ---------------------------------------------------------------------
type GETFnData = PlaylistWithTracks[];

export async function getPlaylists() {
  const allPlaylists = await db.query.playlists.findMany({
    with: {
      tracksToPlaylists: {
        columns: {},
        with: { track: { with: { album: true } } },
      },
    },
  });
  return allPlaylists.map((data) => fixPlaylistJunction(data));
}

type UsePlaylistsOptions<TData = GETFnData> = {
  config?: {
    select?: (data: GETFnData) => TData;
  };
};

/** @description Returns all playlists with its tracks. */
export const usePlaylists = <TData = GETFnData>({
  config,
}: UsePlaylistsOptions<TData>) =>
  useQuery({
    queryKey: playlistKeys.all,
    queryFn: getPlaylists,
    staleTime: Infinity,
    ...config,
  });

/** @description Returns a list of `MediaCardContent` generated from playlists. */
export const usePlaylistsForMediaCard = () =>
  usePlaylists({
    config: {
      select: useCallback(
        (data: GETFnData) =>
          data
            .map((playlist) =>
              formatForMediaCard({ type: "playlist", data: playlist }),
            )
            .toSorted((a, b) => a.title.localeCompare(b.title)),
        [],
      ),
    },
  });

/** @description Return the most-used data in playlist-related modals. */
export const usePlaylistsForModal = () =>
  usePlaylists({
    config: {
      select: useCallback(
        (data: GETFnData) =>
          data
            .map(({ name, tracks }) => ({ name, trackCount: tracks.length }))
            .toSorted((a, b) => a.name.localeCompare(b.name)),
        [],
      ),
    },
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
