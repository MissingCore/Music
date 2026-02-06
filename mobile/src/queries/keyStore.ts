import { createQueryKeyStore } from "@lukemorales/query-key-factory";
import { count, eq, getTableColumns, ne, sql, sum } from "drizzle-orm";

import { db } from "~/db";
import {
  albums,
  artists,
  playlists,
  tracks,
  tracksToArtists,
  tracksToPlaylists,
} from "~/db/schema";

import { getAlbum, getAlbums } from "~/api/album";
import { getArtistAlbums } from "~/api/artist";
import { getFolder } from "~/api/folder";
import { getPlaylist, getPlaylists } from "~/api/playlist";
import {
  getRecentlyPlayedMediaLists,
  getRecentlyPlayedTracks,
} from "~/api/recent";
import { getSortedTracks, getTrack, getTrackPlaylists } from "~/api/track";

import { iAsc, throwIfNoResults } from "~/lib/drizzle";
import { FavoritesPlaylistKey } from "~/modules/media/constants";

/** All of the reusuable query keys. */
export const queries = createQueryKeyStore({
  /** Query keys used in `useQuery` for albums. */
  albums: {
    all: {
      queryKey: null,
      queryFn: () => {
        return db
          .select({
            id: albums.id,
            name: albums.name,
            artistsKey: albums.artistsKey,
            artwork: albums.artwork,
            duration: sum(tracks.duration),
            trackCount: count(tracks.id),
          })
          .from(albums)
          .innerJoin(tracks, eq(albums.id, tracks.albumId))
          .groupBy(albums.name)
          .orderBy(iAsc(albums.name), iAsc(albums.artistsKey));
      },
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
      queryFn: () => {
        return db
          .select({
            ...getTableColumns(artists),
            duration: sum(tracks.duration),
            trackCount: count(tracks.id),
          })
          .from(artists)
          .innerJoin(
            tracksToArtists,
            eq(artists.name, tracksToArtists.artistName),
          )
          .innerJoin(tracks, eq(tracksToArtists.trackId, tracks.id))
          .groupBy(artists.name)
          .orderBy(iAsc(artists.name));
      },
    },
    detail: (artistName: string) => ({
      queryKey: [artistName],
      queryFn: async () => {
        const [artistData, artistTracks, artistAlbums] = await Promise.all([
          throwIfNoResults(
            db.query.artists.findFirst({
              where: (fields, { eq }) => eq(fields.name, artistName),
            }),
          ),
          //? Get the tracks associated with the artist in alphabetical order.
          db
            .select({
              id: tracks.id,
              name: tracks.name,
              artwork: tracks.artwork,
              duration: tracks.duration,
              album: { name: albums.name, artwork: albums.artwork },
            })
            .from(tracksToArtists)
            .where(eq(tracksToArtists.artistName, artistName))
            .innerJoin(tracks, eq(tracksToArtists.trackId, tracks.id))
            .leftJoin(albums, eq(tracks.albumId, albums.id))
            .orderBy(iAsc(tracks.name)),
          getArtistAlbums(artistName),
        ]);
        return { ...artistData, tracks: artistTracks, albums: artistAlbums };
      },
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
  /** Query keys used in `useQuery` for lyrics. */
  lyrics: {
    all: {
      queryKey: null,
      queryFn: () =>
        db.query.lyrics.findMany({
          columns: { lyrics: false },
          with: { tracksToLyrics: true },
          orderBy: (fields) => iAsc(fields.name),
        }),
    },
    detail: (lyricId: string) => ({
      queryKey: [lyricId],
      queryFn: () =>
        throwIfNoResults(
          db.query.lyrics.findFirst({
            where: (fields, { eq }) => eq(fields.id, lyricId),
            with: {
              tracksToLyrics: {
                with: {
                  track: {
                    columns: { id: true, name: true },
                    with: {
                      album: { columns: { name: true } },
                      tracksToArtists: {
                        orderBy: (fields) => iAsc(fields.artistName),
                        columns: { artistName: true },
                      },
                    },
                  },
                },
              },
            },
          }),
        ),
    }),
    forTrack: (trackId: string) => ({
      queryKey: [trackId],
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
    sorted: (order: string, isAsc: boolean) => ({
      queryKey: [order, isAsc],
      //? Internally, `getSortedTracks` reads the live `order` & `isAsc` values.
      queryFn: () => getSortedTracks(),
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
      columns: ["id", "name", "artistsKey", "artwork"],
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
