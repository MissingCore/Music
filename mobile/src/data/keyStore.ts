import { queryOptions } from "@tanstack/react-query";
import { ne } from "drizzle-orm";

import { playlists } from "~/db/schema";

import { getAlbum, getAlbumsSummary } from "./album/api";
import {
  getArtist,
  getArtistsSummary,
  getSortedArtistTracks,
} from "./artist/api";
import { getFavoriteLists } from "./favorite/api";
import { getFolder } from "./folder/api";
import { getGenre, getGenresSummary, getSortedGenreTracks } from "./genre/api";
import { getLyric, getLyricsSummary } from "./lyric/api";
import { getPlaylist, getPlaylistsSummary } from "./playlist/api";
import { getRecentMedia } from "./recent/api";
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
    all: queryOptions({
      queryKey: ["albums", "all"] as const,
      queryFn: () => getAlbumsSummary(),
    }),
    detail: (albumId: string) =>
      queryOptions({
        queryKey: ["albums", "detail", albumId] as const,
        queryFn: () => getAlbum(albumId),
      }),
  },

  /** Query keys used in `useQuery` for artists. */
  artists: {
    _def: ["artists"] as const,
    all: queryOptions({
      queryKey: ["artists", "all"] as const,
      queryFn: getArtistsSummary,
    }),
    detail: (artistName: string) => ({
      ...queryOptions({
        queryKey: ["artists", "detail", artistName] as const,
        queryFn: () => getArtist(artistName, true),
      }),
      _ctx: {
        tracks: (sortOptions?: TracksSortOptions<"artistTracks">) =>
          queryOptions({
            queryKey: [
              "artists",
              "detail",
              artistName,
              "tracks",
              sortOptions,
            ] as const,
            queryFn: () =>
              getSortedArtistTracks(artistName, false, sortOptions),
          }),
      },
    }),
  },

  /** Query keys used in `useQuery` for favorite media. */
  favorites: {
    _def: ["favorites"] as const,
    lists: queryOptions({
      queryKey: ["favorites", "lists"] as const,
      queryFn: getFavoriteLists,
    }),
  },

  /** Query keys used in `useQuery` for folders. */
  folders: {
    _def: ["folders"] as const,
    detail: (sortOptions: TracksSortOptions<"folder">, folderPath?: string) =>
      queryOptions({
        queryKey: ["folders", "detail", folderPath, sortOptions] as const,
        queryFn: () => getFolder(folderPath, sortOptions),
      }),
  },

  /** Query keys used in `useQuery` for genres. */
  genres: {
    _def: ["genres"] as const,
    all: queryOptions({
      queryKey: ["genres", "all"] as const,
      queryFn: getGenresSummary,
    }),
    detail: (genreName: string) => ({
      ...queryOptions({
        queryKey: ["genres", "detail", genreName] as const,
        queryFn: () => getGenre(genreName, true),
      }),
      _ctx: {
        tracks: (sortOptions?: TracksSortOptions<"genreTracks">) =>
          queryOptions({
            queryKey: [
              "genres",
              "detail",
              genreName,
              "tracks",
              sortOptions,
            ] as const,
            queryFn: () => getSortedGenreTracks(genreName, false, sortOptions),
          }),
      },
    }),
  },

  /** Query keys used in `useQuery` for lyrics. */
  lyrics: {
    _def: ["lyrics"] as const,
    all: queryOptions({
      queryKey: ["lyrics", "all"] as const,
      queryFn: getLyricsSummary,
    }),
    detail: (lyricId: string) =>
      queryOptions({
        queryKey: ["lyrics", "detail", lyricId] as const,
        queryFn: () => getLyric(lyricId),
      }),
    forTrack: (trackId: string) =>
      queryOptions({
        queryKey: ["lyrics", "forTrack", trackId] as const,
        queryFn: () => getTrackLyrics(trackId),
      }),
  },

  /** Query keys used in `useQuery` for playlists. */
  playlists: {
    _def: ["playlists"] as const,
    all: queryOptions({
      queryKey: ["playlists", "all"] as const,
      queryFn: () =>
        getPlaylistsSummary(false, [ne(playlists.name, FavoritesPlaylistKey)]),
    }),
    detail: (playlistName: string) =>
      queryOptions({
        queryKey: ["playlists", "detail", playlistName] as const,
        queryFn: () => getPlaylist(playlistName),
      }),
  },

  /** Query keys used in `useQuery` for tracks. */
  tracks: {
    _def: ["tracks"] as const,
    sorted: (sortOptions: TracksSortOptions<"track">) =>
      queryOptions({
        queryKey: ["tracks", "sorted", sortOptions] as const,
        queryFn: () => getSortedTracks(false, sortOptions),
      }),
    detail: (trackId: string) => ({
      ...queryOptions({
        queryKey: ["tracks", "detail", trackId] as const,
        queryFn: () => getTrack(trackId),
      }),
      _ctx: {
        isFavorite: queryOptions({
          queryKey: ["tracks", "detail", trackId, "isFavorite"] as const,
          queryFn: () => getTrackFavoriteStatus(trackId),
        }),
        genres: queryOptions({
          queryKey: ["tracks", "detail", trackId, "genres"] as const,
          queryFn: () => getTrackGenres(trackId),
        }),
        playlists: queryOptions({
          queryKey: ["tracks", "detail", trackId, "playlists"] as const,
          queryFn: () => getTrackPlaylists(trackId),
        }),
      },
    }),
  },

  /** Query keys used in `useQuery` for recently played media. */
  recent: {
    _def: ["recent"] as const,
    all: queryOptions({
      queryKey: ["recent", "all"] as const,
      queryFn: getRecentMedia,
    }),
  },
};
