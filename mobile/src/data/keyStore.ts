// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { queryOptions } from "@tanstack/react-query";
import { ne } from "drizzle-orm";

import { playlists } from "~/db/schema";

import { getAlbum, getAlbumsSummary } from "./album/api";
import { getArtistsSummary } from "./artist/api";
import { getFavoriteLists } from "./favorite/api";
import { getGenresSummary } from "./genre/api";
import { getPlaylist, getPlaylistsSummary } from "./playlist/api";
import {
  getSortedTracks,
  getTrack,
  getTrackFavoriteStatus,
  getTrackGenres,
  getTrackLyrics,
  getTrackPlaylists,
} from "./track/api";
import type { TracksSortOptions } from "./types";

import { FavoritesPlaylistKey } from "~/modules/media/constants";

/** All of the reusable query keys. */
export const queries = {
  /** Query keys used in `useQuery` for albums. */
  albums: {
    _def: ["albums"] as const,
    get all() {
      return queryOptions({
        queryKey: [...this._def, "all"],
        queryFn: () => getAlbumsSummary(),
      });
    },
    detail(albumId: string) {
      return queryOptions({
        queryKey: [...this._def, "detail", albumId],
        queryFn: () => getAlbum(albumId),
      });
    },
  },

  /** Query keys used in `useQuery` for artists. */
  artists: {
    _def: ["artists"] as const,
    get all() {
      return queryOptions({
        queryKey: [...this._def, "all"],
        queryFn: getArtistsSummary,
      });
    },
  },

  /** Query keys used in `useQuery` for favorite media. */
  favorites: {
    _def: ["favorites"] as const,
    get lists() {
      return queryOptions({
        queryKey: [...this._def, "lists"],
        queryFn: getFavoriteLists,
      });
    },
  },

  /** Query keys used in `useQuery` for genres. */
  genres: {
    _def: ["genres"] as const,
    get all() {
      return queryOptions({
        queryKey: [...this._def, "all"],
        queryFn: getGenresSummary,
      });
    },
  },

  /** Query keys used in `useQuery` for playlists. */
  playlists: {
    _def: ["playlists"] as const,
    get all() {
      return queryOptions({
        queryKey: [...this._def, "all"],
        queryFn: () =>
          getPlaylistsSummary(false, [
            ne(playlists.name, FavoritesPlaylistKey),
          ]),
      });
    },
    detail(playlistName: string) {
      return queryOptions({
        queryKey: [...this._def, "detail", playlistName],
        queryFn: () => getPlaylist(playlistName),
      });
    },
  },

  /** Query keys used in `useQuery` for tracks. */
  tracks: {
    _def: ["tracks"] as const,
    sorted(sortOptions: TracksSortOptions<"track">) {
      return queryOptions({
        queryKey: [...this._def, "sorted", sortOptions],
        queryFn: () => getSortedTracks(false, sortOptions),
      });
    },
    detail(trackId: string) {
      const detail = queryOptions({
        queryKey: [...this._def, "detail", trackId],
        queryFn: () => getTrack(trackId),
      });
      return {
        ...detail,
        _ctx: {
          // eslint-disable-next-line @tanstack/query/exhaustive-deps
          isFavorite: queryOptions({
            queryKey: [...detail.queryKey, "isFavorite"],
            queryFn: () => getTrackFavoriteStatus(trackId),
          }),
          // eslint-disable-next-line @tanstack/query/exhaustive-deps
          genres: queryOptions({
            queryKey: [...detail.queryKey, "genres"],
            queryFn: () => getTrackGenres(trackId),
          }),
          // eslint-disable-next-line @tanstack/query/exhaustive-deps
          lyrics: queryOptions({
            queryKey: [...detail.queryKey, "lyrics"],
            queryFn: () => getTrackLyrics(trackId),
          }),
          // eslint-disable-next-line @tanstack/query/exhaustive-deps
          playlists: queryOptions({
            queryKey: [...detail.queryKey, "playlists"],
            queryFn: () => getTrackPlaylists(trackId),
          }),
        },
      };
    },
  },
};
