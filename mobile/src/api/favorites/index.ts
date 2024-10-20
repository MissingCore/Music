import { queryOptions, useQuery } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { useCallback } from "react";

import { albums, playlists } from "@/db/schema";
import { getAlbums, getPlaylists, getSpecialPlaylist } from "@/db/queries";
import {
  formatForCurrentPages,
  formatForMediaCard,
} from "@/db/utils/formatters";
import { favoriteKeys } from "./_queryKeys";

import type { ExtractFnReturnType } from "@/utils/types";
import { ReservedPlaylists } from "@/modules/media/constants";

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

type FavoriteTracksFnData = ExtractFnReturnType<typeof getSpecialPlaylist>;

/** Returns an object containing favorited albums & playlists. */
export const favoriteListsOptions = () =>
  queryOptions({
    queryKey: favoriteKeys.lists(),
    queryFn: getFavoriteLists,
    staleTime: Infinity,
  });

/** Returns a list of favorited tracks. */
export const favoriteTracksOptions = () =>
  queryOptions({
    queryKey: favoriteKeys.tracks(),
    queryFn: () => getSpecialPlaylist(ReservedPlaylists.favorites),
    staleTime: Infinity,
  });

/**
 * Return a list of `MediaCardContent` generated from favorited albums &
 * playlists.
 */
export const useFavoriteListsForMediaCard = () =>
  useQuery({
    ...favoriteListsOptions(),
    select: useCallback(
      (data: FavoriteListsFnData) =>
        [
          ...data.albums.map((album) =>
            formatForMediaCard({ type: "album", data: album }),
          ),
          ...data.playlists.map((playlist) =>
            formatForMediaCard({ type: "playlist", data: playlist }),
          ),
        ].sort((a, b) => a.title.localeCompare(b.title)),
      [],
    ),
  });

/** Returns number of favorited tracks. */
export const useFavoriteTracksCount = () =>
  useQuery({
    ...favoriteTracksOptions(),
    select: useCallback((data: FavoriteTracksFnData) => data.tracks.length, []),
  });

/**
 * Return data to render "MediaList" components on the
 * `/playlist/${SpecialPlaylists.favorites}` route.
 */
export const useFavoriteTracksForCurrentPage = () =>
  useQuery({
    ...favoriteTracksOptions(),
    select: useCallback(
      (data: FavoriteTracksFnData) => ({
        ...formatForCurrentPages({ type: "playlist", data }),
        imageSource: ReservedPlaylists.favorites,
      }),
      [],
    ),
  });
