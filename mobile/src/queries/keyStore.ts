import { createQueryKeyStore } from "@lukemorales/query-key-factory";
import { eq } from "drizzle-orm";

import { albums, playlists } from "~/db/schema";

import { getAlbum, getAlbums } from "~/api/album";
import { getArtist, getArtistAlbums, getArtists } from "~/api/artist";
import { getFolder } from "~/api/folder";
import { getPlaylist, getPlaylists, getSpecialPlaylist } from "~/api/playlist";
import {
  getDatabaseSummary,
  getLatestRelease,
  getSaveErrors,
  getStorageSummary,
} from "~/api/setting";
import { getTrack, getTrackPlaylists, getTracks } from "~/api/track";

import { ReservedPlaylists } from "~/modules/media/constants";

/** All of the reusuable query keys. */
export const queries = createQueryKeyStore({
  /** Query keys used in `useQuery` for albums. */
  albums: {
    all: {
      queryKey: null,
      queryFn: () =>
        getAlbums({
          columns: ["id", "name", "artistName", "artwork"],
          withTracks: false,
        }),
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
      queryFn: () =>
        getArtists({
          columns: ["name", "artwork"],
          withTracks: false,
        }),
    },
    detail: (artistName: string) => ({
      queryKey: [artistName],
      queryFn: async () => ({
        ...(await getArtist(artistName)),
        albums: await getArtistAlbums(artistName),
      }),
    }),
  },
  /** Query keys used in `useQuery` for favorite media. */
  favorites: {
    lists: {
      queryKey: null,
      queryFn: () => getFavoriteLists(),
    },
    tracks: {
      queryKey: [ReservedPlaylists.favorites],
      queryFn: () => getSpecialPlaylist(ReservedPlaylists.favorites),
    },
  },
  /** Query keys used in `useQuery` for folders. */
  folders: {
    detail: (folderPath?: string) => ({
      queryKey: [folderPath],
      queryFn: () => getFolder(folderPath),
    }),
  },
  /** Query keys used in `useQuery` for playlists. */
  playlists: {
    all: {
      queryKey: null,
      queryFn: () =>
        getPlaylists({
          columns: ["name", "artwork"],
          trackColumns: ["artwork"],
          albumColumns: ["artwork"],
        }),
    },
    detail: (playlistName: string) => ({
      queryKey: [playlistName],
      queryFn: () => getPlaylist(playlistName),
    }),
  },
  /** Query keys used in `useQuery` for tracks. */
  tracks: {
    all: {
      queryKey: null,
      queryFn: () =>
        getTracks({
          columns: [
            "id",
            "name",
            "artistName",
            "duration",
            "artwork",
            "modificationTime",
          ],
          albumColumns: ["name", "artistName", "artwork"],
        }),
    },
    detail: (trackId: string) => ({
      queryKey: [trackId],
      queryFn: () => getTrack(trackId),
      contextQueries: {
        playlists: {
          // eslint-disable-next-line @tanstack/query/exhaustive-deps
          queryKey: null,
          queryFn: () => getTrackPlaylists(trackId),
        },
      },
    }),
  },

  /** Query keys used in `useQuery` for "setting" related features. */
  settings: {
    releaseNote: {
      queryKey: null,
      queryFn: () => getLatestRelease(),
    },
    saveErrors: {
      queryKey: null,
      queryFn: () => getSaveErrors(),
    },
    summary: {
      queryKey: null,
      contextQueries: {
        database: {
          queryKey: null,
          queryFn: () => getDatabaseSummary(),
        },
        storage: {
          queryKey: null,
          queryFn: () => getStorageSummary(),
        },
      },
    },
  },
});

/** Get favorited albums & playlists. */
async function getFavoriteLists() {
  const [favAlbums, favPlaylists] = await Promise.all([
    getAlbums({
      where: [eq(albums.isFavorite, true)],
      columns: ["id", "name", "artistName", "artwork"],
      withTracks: false,
    }),
    getPlaylists({
      where: [eq(playlists.isFavorite, true)],
      columns: ["name", "artwork"],
      trackColumns: ["artwork"],
      albumColumns: ["artwork"],
    }),
  ]);
  return { albums: favAlbums, playlists: favPlaylists };
}
