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
      queryFn: () => getAlbums(),
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
      queryFn: () => getArtists(),
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
      queryFn: () => getPlaylists(),
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
      queryFn: () => getTracks(),
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
    getAlbums({ where: [eq(albums.isFavorite, true)] }),
    getPlaylists([eq(playlists.isFavorite, true)]),
  ]);
  return { albums: favAlbums, playlists: favPlaylists };
}
