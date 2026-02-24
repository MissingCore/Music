import { createQueryKeyStore } from "@lukemorales/query-key-factory";
import { count, eq, ne, sql, sum } from "drizzle-orm";

import { db } from "~/db";
import { albums, playlists, tracks, tracksToPlaylists } from "~/db/schema";

import { getPlaylist } from "~/api/playlist";
import {
  getRecentlyPlayedMediaLists,
  getRecentlyPlayedTracks,
} from "~/api/recent";
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

import { iAsc } from "~/lib/drizzle";
import { FavoritesPlaylistKey } from "~/modules/media/constants";
import type { ScreenSortOptions } from "~/stores/ViewPreference/constants";

/** All of the reusuable query keys. */
export const queries = createQueryKeyStore({
  /** Query keys used in `useQuery` for albums. */
  albums: {
    all: {
      queryKey: null,
      queryFn: getAlbumsSummary,
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
      queryFn: () => getFavoriteLists(),
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
      queryFn: () => {
        //? Create a subquery which orders the tracks as `json_group_array` doesn't
        //? guarantee respecting the order from `orderBy`.
        const ordered = db
          .select({
            playlistName: tracksToPlaylists.playlistName,
            position: tracksToPlaylists.position,
            //! For some weird reason, defining this between `playlistName` &
            //! `position` with `tracksToPlaylists.trackId` results in the
            //! incorrect order of tracks.
            trackId: tracks.id,
            trackDuration: tracks.duration,
            derivedArtwork: sql<
              string | null
            >`coalesce(${tracks.artwork}, ${albums.artwork})`.as(
              "derived_artwork",
            ),
          })
          .from(tracksToPlaylists)
          .innerJoin(tracks, eq(tracksToPlaylists.trackId, tracks.id))
          .leftJoin(albums, eq(tracks.albumId, albums.id))
          .orderBy(
            iAsc(tracksToPlaylists.playlistName),
            iAsc(tracksToPlaylists.position),
          )
          .as("ordered");
        return db
          .select({
            name: playlists.name,
            artwork: playlists.artwork,
            duration: sum(ordered.trackDuration),
            trackCount: count(ordered.trackId),
            /** We need to unencode this string. */
            collageArtwork: sql<string>`json_group_array(${ordered.derivedArtwork})`,
          })
          .from(playlists)
          .leftJoin(ordered, eq(playlists.name, ordered.playlistName))
          .groupBy(playlists.name)
          .where(ne(playlists.name, FavoritesPlaylistKey))
          .orderBy(iAsc(playlists.name));
      },
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
    mediaLists: {
      queryKey: null,
      queryFn: () => getRecentlyPlayedMediaLists(),
    },
    tracks: {
      queryKey: null,
      queryFn: () => getRecentlyPlayedTracks(),
    },
  },
});
