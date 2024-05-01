import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { db } from "@/db";
import type { PlaylistWithTracks } from "@/db/schema";
import { fixPlaylistJunction, formatForMediaCard } from "@/db/utils/formatters";
import { playlistKeys } from "./_queryKeys";

type QueryFnData = PlaylistWithTracks[];

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

type UsePlaylistsOptions<TData = QueryFnData> = {
  config?: {
    select?: (data: QueryFnData) => TData;
  };
};

/** @description Returns all playlists with its tracks. */
export const usePlaylists = <TData = QueryFnData>({
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
        (data: QueryFnData) =>
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
        (data: QueryFnData) =>
          data
            .map(({ name, tracks }) => ({ name, trackCount: tracks.length }))
            .toSorted((a, b) => a.name.localeCompare(b.name)),
        [],
      ),
    },
  });
