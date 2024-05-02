import { useQuery } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { useCallback } from "react";

import { albums, playlists, tracks } from "@/db/schema";
import { getAlbums, getPlaylists, getTracks } from "@/db/queries";
import {
  formatForCurrentPages,
  formatForMediaCard,
} from "@/db/utils/formatters";
import { favoriteKeys } from "./_queryKeys";

import type { ExtractFnReturnType } from "@/utils/types";
import { SpecialPlaylists } from "@/features/playback/utils/trackList";

type FavoriteListsFnData = {
  albums: ExtractFnReturnType<typeof getAlbums>;
  playlists: ExtractFnReturnType<typeof getPlaylists>;
};

export async function getFavoriteLists() {
  const [favoriteAlbums, favoritePlaylists] = await Promise.all([
    getAlbums([eq(albums.isFavorite, true)]),
    getPlaylists([eq(playlists.isFavorite, true)]),
  ]);
  return { albums: favoriteAlbums, playlists: favoritePlaylists };
}

type FavoriteTracksFnData = ExtractFnReturnType<typeof getTracks>;

export async function getFavoriteTracks() {
  return await getTracks([eq(tracks.isFavorite, true)]);
}

type UseFavoriteOptions<
  TData extends FavoriteListsFnData | FavoriteTracksFnData,
  TResult = TData,
> = {
  config?: {
    select?: (data: TData) => TResult;
  };
};

/** @description Returns an object containing favorited albums & playlists. */
export const useFavoriteLists = <TData = FavoriteListsFnData>({
  config,
}: UseFavoriteOptions<FavoriteListsFnData, TData>) =>
  useQuery({
    queryKey: favoriteKeys.lists(),
    queryFn: getFavoriteLists,
    staleTime: Infinity,
    ...config,
  });

/** @description Returns an list of favorited tracks. */
export const useFavoriteTracks = <TData = FavoriteTracksFnData>({
  config,
}: UseFavoriteOptions<FavoriteTracksFnData, TData>) =>
  useQuery({
    queryKey: favoriteKeys.tracks(),
    queryFn: getFavoriteTracks,
    staleTime: Infinity,
    ...config,
  });

/**
 * @description Return a list of `MediaCardContent` generated from
 *  favorited albums & playlists.
 */
export const useFavoriteListsForMediaCard = () =>
  useFavoriteLists({
    config: {
      select: useCallback(
        (data: FavoriteListsFnData) =>
          [
            ...data.albums.map((album) =>
              formatForMediaCard({ type: "album", data: album }),
            ),
            ...data.playlists.map((playlist) =>
              formatForMediaCard({ type: "playlist", data: playlist }),
            ),
          ].toSorted((a, b) => a.title.localeCompare(b.title)),
        [],
      ),
    },
  });

/** @description Returns number of favorited tracks. */
export const useFavoriteTracksCount = () =>
  useFavoriteTracks({
    config: {
      select: useCallback((data: FavoriteTracksFnData) => data.length, []),
    },
  });

/**
 * @description Return data to render "MediaList" components on the
 *  `/playlist/${SpecialPlaylists.favorites}` route.
 */
export const useFavoriteTracksForCurrentPage = () =>
  useFavoriteTracks({
    config: {
      select: useCallback(
        (data: FavoriteTracksFnData) => ({
          ...formatForCurrentPages({
            type: "playlist",
            data: {
              name: SpecialPlaylists.favorites,
              coverSrc: SpecialPlaylists.favorites,
              isFavorite: false,
              tracks: data,
            },
          }),
          imageSource: SpecialPlaylists.favorites,
        }),
        [],
      ),
    },
  });
