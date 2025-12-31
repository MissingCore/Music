import { createQueryKeyStore } from "@lukemorales/query-key-factory";
import { eq } from "drizzle-orm";

import { db } from "~/db";
import { albums, playlists } from "~/db/schema";

import { getAlbum, getAlbums } from "~/api/album";
import { getArtistAlbums } from "~/api/artist";
import { normalizeArtist } from "~/api/artist.utils";
import { getFolder } from "~/api/folder";
import { getPlaylist, getPlaylists, getSpecialPlaylist } from "~/api/playlist";
import {
  getRecentlyPlayedMediaLists,
  getRecentlyPlayedTracks,
} from "~/api/recent";
import { getTrack, getTrackPlaylists, getTracks } from "~/api/track";

import { iAsc, throwIfNoResults } from "~/lib/drizzle";
import { ReservedPlaylists } from "~/modules/media/constants";

/** All of the reusuable query keys. */
export const queries = createQueryKeyStore({
  /** Query keys used in `useQuery` for albums. */
  albums: {
    all: {
      queryKey: null,
      queryFn: () =>
        db.query.albums.findMany({
          columns: { id: true, name: true, artistName: true, artwork: true },
          with: { tracks: { columns: { id: true } } },
          orderBy: (fields) => [iAsc(fields.name), iAsc(fields.artistName)],
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
        db.query.artists.findMany({
          orderBy: (fields) => iAsc(fields.name),
          //? Relation used to filter out artists with no tracks.
          with: { tracksToArtists: { columns: { trackId: true }, limit: 1 } },
        }),
    },
    detail: (artistName: string) => ({
      queryKey: [artistName],
      queryFn: async () => {
        const [artistData, artistAlbums] = await Promise.all([
          throwIfNoResults(
            db.query.artists.findFirst({
              where: (fields, { eq }) => eq(fields.name, artistName),
              with: {
                tracksToArtists: {
                  columns: {},
                  with: { track: { with: { album: true } } },
                },
              },
            }),
          ),
          getArtistAlbums(artistName),
        ]);
        return { ...normalizeArtist(artistData), albums: artistAlbums };
      },
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
            "discoverTime",
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
