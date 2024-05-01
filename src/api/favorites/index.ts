import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { db } from "@/db";
import type {
  AlbumWithTracks,
  PlaylistWithTracks,
  TrackWithAlbum,
} from "@/db/schema";
import {
  fixPlaylistJunction,
  formatForCurrentPages,
  formatForMediaCard,
} from "@/db/utils/formatters";
import { favoriteKeys } from "./_queryKey";

import { SpecialPlaylists } from "@/features/playback/utils/trackList";

type FavoriteListsFnData = {
  albums: AlbumWithTracks[];
  playlists: PlaylistWithTracks[];
};

export async function getFavoriteLists() {
  const [favoriteAlbums, favoritePlaylists] = await Promise.all([
    db.query.albums.findMany({
      where: (fields, { eq }) => eq(fields.isFavorite, true),
      with: { tracks: true },
    }),
    db.query.playlists.findMany({
      where: (fields, { eq }) => eq(fields.isFavorite, true),
      with: {
        tracksToPlaylists: {
          columns: {},
          with: { track: { with: { album: true } } },
        },
      },
    }),
  ]);

  return {
    albums: favoriteAlbums,
    playlists: favoritePlaylists.map((data) => fixPlaylistJunction(data)),
  };
}

type FavoriteTracksFnData = TrackWithAlbum[];

export async function getFavoriteTracks() {
  return await db.query.tracks.findMany({
    where: (fields, { eq }) => eq(fields.isFavorite, true),
    with: { album: true },
  });
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
