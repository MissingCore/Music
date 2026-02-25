import { createQueryKeyStore } from "@lukemorales/query-key-factory";
import { ne } from "drizzle-orm";

import { db } from "~/db";
import { playlists } from "~/db/schema";

import {
  getSortedTracks,
  getTrack,
  getTrackGenres,
  getTrackPlaylists,
} from "~/api/track";
import { getAlbum, getAlbumsSummary } from "~/data/album/api";
import { getArtist, getArtistsSummary } from "~/data/artist/api";
import { getFavoriteLists } from "~/data/favorite/api";
import { getFolder } from "~/data/folder/api";
import { getGenre, getGenresSummary } from "~/data/genre/api";
import { getLyric, getLyricsSummary } from "~/data/lyric/api";
import { getPlaylist, getPlaylistsSummary } from "~/data/playlist/api";
import { getRecentMedia } from "~/data/recent/api";

import { FavoritesPlaylistKey } from "~/modules/media/constants";
import type { ScreenSortOptions } from "~/stores/ViewPreference/constants";

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
    detail: (artistName: string) => ({
      queryKey: [artistName],
      queryFn: () => getArtist(artistName),
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
    detail: (folderPath?: string) => ({
      queryKey: [folderPath],
      queryFn: () => getFolder(folderPath),
    }),
  },
  /** Query keys used in `useQuery` for genres. */
  genres: {
    all: {
      queryKey: null,
      queryFn: getGenresSummary,
    },
    detail: (genreName: string) => ({
      queryKey: [genreName],
      queryFn: () => getGenre(genreName),
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
      // FIXME: Have a `getTracklyrics` in `~/data/track/api.ts`.
      queryFn: async () => {
        const data = await db.query.tracksToLyrics.findFirst({
          where: (fields, { eq }) => eq(fields.trackId, trackId),
          with: { lyric: true },
        });
        return data?.lyric ?? null;
      },
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
    sorted: (order: ScreenSortOptions<"track">, isAsc: boolean) => ({
      queryKey: [order, isAsc],
      queryFn: () => getSortedTracks("sortedTracks", { order, isAsc }),
    }),
    detail: (trackId: string) => ({
      queryKey: [trackId],
      queryFn: () => getTrack(trackId),
      contextQueries: {
        isFavorite: {
          queryKey: null,
          queryFn: async () => {
            const isFavorited = await db.query.tracksToPlaylists.findFirst({
              where: (fields, { and, eq }) =>
                and(
                  eq(fields.playlistName, FavoritesPlaylistKey),
                  eq(fields.trackId, trackId),
                ),
            });
            return isFavorited ? true : false;
          },
        },
        genres: {
          // eslint-disable-next-line @tanstack/query/exhaustive-deps
          queryKey: null,
          queryFn: () => getTrackGenres(trackId),
        },
        playlists: {
          // eslint-disable-next-line @tanstack/query/exhaustive-deps
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
