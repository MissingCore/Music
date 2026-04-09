import { createQueryKeyStore } from "@lukemorales/query-key-factory";
import { ne } from "drizzle-orm";

import { playlists } from "~/db/schema";

import { getAlbum, getAlbumsSummary } from "./album/api";
import { getArtist, getArtistsSummary } from "./artist/api";
import { getFavoriteLists } from "./favorite/api";
import { getFolder } from "./folder/api";
import { getGenre, getGenresSummary } from "./genre/api";
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

/** All of the reusuable query keys. */
export const queries = createQueryKeyStore({
  /** Query keys used in `useQuery` for albums. */
  albums: {
    all: {
      queryKey: null,
      queryFn: () => getAlbumsSummary(),
    },
    detail: (albumId: string) => ({
      queryKey: [albumId],
      queryFn: () => getAlbum(albumId),
    }),
  },
  /** Query keys used in `useQuery` for artists. */
  artists: {
    all: {
      queryKey: null,
      queryFn: getArtistsSummary,
    },
    detail: (
      artistName: string,
      sortOptions?: TracksSortOptions<"artistTracks">,
    ) => ({
      queryKey: [artistName, sortOptions],
      queryFn: () => getArtist(artistName, false, sortOptions),
    }),
  },
  /** Query keys used in `useQuery` for favorite media. */
  favorites: {
    lists: {
      queryKey: null,
      queryFn: getFavoriteLists,
    },
  },
  /** Query keys used in `useQuery` for folders. */
  folders: {
    detail: (
      sortOptions: TracksSortOptions<"folder">,
      folderPath?: string,
    ) => ({
      queryKey: [sortOptions, folderPath],
      queryFn: () => getFolder(folderPath, sortOptions),
    }),
  },
  /** Query keys used in `useQuery` for genres. */
  genres: {
    all: {
      queryKey: null,
      queryFn: getGenresSummary,
    },
    detail: (
      genreName: string,
      sortOptions?: TracksSortOptions<"genreTracks">,
    ) => ({
      queryKey: [genreName, sortOptions],
      queryFn: () => getGenre(genreName, false, sortOptions),
    }),
  },
  /** Query keys used in `useQuery` for lyrics. */
  lyrics: {
    all: {
      queryKey: null,
      queryFn: getLyricsSummary,
    },
    detail: (lyricId: string) => ({
      queryKey: [lyricId],
      queryFn: () => getLyric(lyricId),
    }),
    forTrack: (trackId: string) => ({
      queryKey: [trackId],
      queryFn: () => getTrackLyrics(trackId),
    }),
  },
  /** Query keys used in `useQuery` for playlists. */
  playlists: {
    all: {
      queryKey: null,
      queryFn: () =>
        getPlaylistsSummary(false, [ne(playlists.name, FavoritesPlaylistKey)]),
    },
    detail: (playlistName: string) => ({
      queryKey: [playlistName],
      queryFn: () => getPlaylist(playlistName),
    }),
  },
  /** Query keys used in `useQuery` for tracks. */
  tracks: {
    sorted: (sortOptions: TracksSortOptions<"track">) => ({
      queryKey: [sortOptions],
      queryFn: () => getSortedTracks(false, sortOptions),
    }),
    detail: (trackId: string) => ({
      queryKey: [trackId],
      queryFn: () => getTrack(trackId),
      contextQueries: {
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        isFavorite: {
          queryKey: null,
          queryFn: () => getTrackFavoriteStatus(trackId),
        },
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        genres: {
          queryKey: null,
          queryFn: () => getTrackGenres(trackId),
        },
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        playlists: {
          queryKey: null,
          queryFn: () => getTrackPlaylists(trackId),
        },
      },
    }),
  },

  /** Query keys used in `useQuery` for recently played media. */
  recent: {
    all: {
      queryKey: null,
      queryFn: getRecentMedia,
    },
  },
});
