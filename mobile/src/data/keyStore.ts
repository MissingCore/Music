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
    _def: ["albums"],
    all: queryOptions({
      queryKey: ["albums", "all"],
      queryFn: () => getAlbumsSummary(),
    }),
    detail: (albumId: string) =>
      queryOptions({
        queryKey: ["albums", "detail", albumId],
        queryFn: () => getAlbum(albumId),
      }),
  },

  /** Query keys used in `useQuery` for artists. */
  artists: {
    _def: ["artists"],
    all: queryOptions({
      queryKey: ["artists", "all"],
      queryFn: getArtistsSummary,
    }),
    detail: (artistName: string) => {
      const detail = queryOptions({
        queryKey: ["artists", "detail", artistName],
        queryFn: () => getArtist(artistName, true),
      });
      return {
        ...detail,
        _ctx: {
          tracks: (sortOptions?: TracksSortOptions<"artistTracks">) =>
            // eslint-disable-next-line @tanstack/query/exhaustive-deps
            queryOptions({
              queryKey: [...detail.queryKey, "tracks", sortOptions],
              queryFn: () =>
                getSortedArtistTracks(artistName, false, sortOptions),
            }),
        },
      };
    },
  },

  /** Query keys used in `useQuery` for favorite media. */
  favorites: {
    _def: ["favorites"],
    lists: queryOptions({
      queryKey: ["favorites", "lists"],
      queryFn: getFavoriteLists,
    }),
  },

  /** Query keys used in `useQuery` for folders. */
  folders: {
    _def: ["folders"],
    detail: (sortOptions: TracksSortOptions<"folder">, folderPath?: string) =>
      queryOptions({
        queryKey: ["folders", "detail", folderPath, sortOptions],
        queryFn: () => getFolder(folderPath, sortOptions),
      }),
  },

  /** Query keys used in `useQuery` for genres. */
  genres: {
    _def: ["genres"],
    all: queryOptions({
      queryKey: ["genres", "all"],
      queryFn: getGenresSummary,
    }),
    detail: (genreName: string) => {
      const detail = queryOptions({
        queryKey: ["genres", "detail", genreName],
        queryFn: () => getGenre(genreName, true),
      });
      return {
        ...detail,
        _ctx: {
          tracks: (sortOptions?: TracksSortOptions<"genreTracks">) =>
            // eslint-disable-next-line @tanstack/query/exhaustive-deps
            queryOptions({
              queryKey: [...detail.queryKey, "tracks", sortOptions],
              queryFn: () =>
                getSortedGenreTracks(genreName, false, sortOptions),
            }),
        },
      };
    },
  },

  /** Query keys used in `useQuery` for lyrics. */
  lyrics: {
    _def: ["lyrics"],
    all: queryOptions({
      queryKey: ["lyrics", "all"],
      queryFn: getLyricsSummary,
    }),
    detail: (lyricId: string) =>
      queryOptions({
        queryKey: ["lyrics", "detail", lyricId],
        queryFn: () => getLyric(lyricId),
      }),
    forTrack: (trackId: string) =>
      queryOptions({
        queryKey: ["lyrics", "forTrack", trackId],
        queryFn: () => getTrackLyrics(trackId),
      }),
  },

  /** Query keys used in `useQuery` for playlists. */
  playlists: {
    _def: ["playlists"],
    all: queryOptions({
      queryKey: ["playlists", "all"],
      queryFn: () =>
        getPlaylistsSummary(false, [ne(playlists.name, FavoritesPlaylistKey)]),
    }),
    detail: (playlistName: string) =>
      queryOptions({
        queryKey: ["playlists", "detail", playlistName],
        queryFn: () => getPlaylist(playlistName),
      }),
  },

  /** Query keys used in `useQuery` for tracks. */
  tracks: {
    _def: ["tracks"],
    sorted: (sortOptions: TracksSortOptions<"track">) =>
      queryOptions({
        queryKey: ["tracks", "sorted", sortOptions],
        queryFn: () => getSortedTracks(false, sortOptions),
      }),
    detail: (trackId: string) => {
      const detail = queryOptions({
        queryKey: ["tracks", "detail", trackId],
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
          playlists: queryOptions({
            queryKey: [...detail.queryKey, "playlists"],
            queryFn: () => getTrackPlaylists(trackId),
          }),
        },
      };
    },
  },

  /** Query keys used in `useQuery` for recently played media. */
  recent: {
    _def: ["recent"],
    all: queryOptions({
      queryKey: ["recent", "all"],
      queryFn: getRecentMedia,
    }),
  },
};
