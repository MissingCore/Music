import type { SQL } from "drizzle-orm";
import { and, eq } from "drizzle-orm";

import { db } from ".";
import { tracks } from "./schema";
import { fixPlaylistJunction, getTrackCover } from "./utils/formatters";

import type { SpecialPlaylistName } from "@/features/playback/constants";
import { SpecialPlaylists } from "@/features/playback/constants";

/** @description Throws error if no album is found. */
export async function getAlbum(filters: SQL[]) {
  const album = await db.query.albums.findFirst({
    where: and(...filters),
    with: { tracks: true },
  });
  if (!album) throw new Error("Album doesn't exist.");
  return album;
}

export async function getAlbums(filters?: SQL[]) {
  return await db.query.albums.findMany({
    where: and(...(filters ?? [])),
    with: { tracks: true },
  });
}

/** @description Throws error if no artist is found. */
export async function getArtist(filters: SQL[]) {
  const artist = await db.query.artists.findFirst({
    where: and(...filters),
    with: { tracks: { with: { album: true } } },
  });
  if (!artist) throw new Error("Artist doesn't exist.");
  return artist;
}

export async function getArtists(filters?: SQL[]) {
  return await db.query.artists.findMany({
    where: and(...(filters ?? [])),
    with: { tracks: { with: { album: true } } },
  });
}

/** @description Throws error if no playlist is found. */
export async function getPlaylist(filters: SQL[]) {
  const playlist = await db.query.playlists.findFirst({
    where: and(...filters),
    with: {
      tracksToPlaylists: {
        columns: {},
        with: { track: { with: { album: true } } },
      },
    },
  });
  if (!playlist) throw new Error("Playlist doesn't exist.");
  return fixPlaylistJunction(playlist);
}

export async function getPlaylists(filters?: SQL[]) {
  const allPlaylists = await db.query.playlists.findMany({
    where: and(...(filters ?? [])),
    with: {
      tracksToPlaylists: {
        columns: {},
        with: { track: { with: { album: true } } },
      },
    },
  });
  return allPlaylists.map((data) => fixPlaylistJunction(data));
}

/**
 * @description Returns tracks in a `SpecialPlaylist` formatted as
 *  `PlaylistWithTracks`.
 */
export async function getSpecialPlaylist(name: SpecialPlaylistName) {
  const _tracks = await getTracks(
    SpecialPlaylists.favorites === name
      ? [eq(tracks.isFavorite, true)]
      : undefined,
  );
  return {
    ...{ name, isFavorite: false, tracks: _tracks },
    coverSrc: SpecialPlaylists.favorites ? name : null,
  };
}

/** @description Throws error if no track is found. */
export async function getTrack(filters: SQL[]) {
  const track = await db.query.tracks.findFirst({
    where: and(...filters),
    with: { album: true },
  });
  if (!track) throw new Error("Track doesn't exist.");
  return { ...track, coverSrc: getTrackCover(track) };
}

export async function getTracks(filters?: SQL[]) {
  const data = await db.query.tracks.findMany({
    where: and(...(filters ?? [])),
    with: { album: true },
  });
  return data.map((track) => ({ ...track, coverSrc: getTrackCover(track) }));
}

export async function getTracksToPlaylists(filters?: SQL[]) {
  const allTracksToPlaylists = await db.query.tracksToPlaylists.findMany({
    where: and(...(filters ?? [])),
    columns: {},
    with: { playlist: true },
  });
  return allTracksToPlaylists.map(({ playlist }) => playlist);
}
