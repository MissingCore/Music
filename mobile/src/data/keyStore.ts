import { queryOptions } from "@tanstack/react-query";
import { ne } from "drizzle-orm";

import { playlists } from "~/db/schema";

import { getGenre, getGenres, getGenreTracks } from "~/adapters/consumer";

import { getAlbum, getAlbumsSummary } from "./album/api";
import {
  getArtist,
  getArtistsSummary,
  getSortedArtistTracks,
} from "./artist/api";
import { getFavoriteLists } from "./favorite/api";
import { getLyric, getLyricsSummary } from "./lyric/api";
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
    detail(artistName: string) {
      const detail = queryOptions({
        queryKey: [...this._def, "detail", artistName],
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
        queryFn: getGenres,
      });
    },
    detail(route: string) {
      const detail = queryOptions({
        queryKey: [...this._def, "detail", route],
        queryFn: () => getGenre(route),
      });
      return {
        ...detail,
        _ctx: {
          tracks: (sortOptions?: TracksSortOptions<"genreTracks">) =>
            // eslint-disable-next-line @tanstack/query/exhaustive-deps
            queryOptions({
              queryKey: [...detail.queryKey, "tracks", sortOptions],
              queryFn: () => getGenreTracks(route, sortOptions),
            }),
        },
      };
    },
  },

  /** Query keys used in `useQuery` for lyrics. */
  lyrics: {
    _def: ["lyrics"] as const,
    get all() {
      return queryOptions({
        queryKey: [...this._def, "all"],
        queryFn: getLyricsSummary,
      });
    },
    detail(lyricId: string) {
      return queryOptions({
        queryKey: [...this._def, "detail", lyricId],
        queryFn: () => getLyric(lyricId),
      });
    },
    forTrack(trackId: string) {
      return queryOptions({
        queryKey: [...this._def, "forTrack", trackId],
        queryFn: () => getTrackLyrics(trackId),
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
          playlists: queryOptions({
            queryKey: [...detail.queryKey, "playlists"],
            queryFn: () => getTrackPlaylists(trackId),
          }),
        },
      };
    },
  },
};
