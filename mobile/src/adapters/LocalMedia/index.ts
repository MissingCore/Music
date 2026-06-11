import { eq, getTableColumns, sum, count } from "drizzle-orm";

import { db } from "~/db";
import {
  albums,
  artists,
  genres,
  playlists,
  tracks,
  tracksToArtists,
  tracksToGenres,
  tracksToPlaylists,
} from "~/db/schema";

import { AlbumArtistsKey } from "~/data/album/utils";

import type { Adapter } from "../types";
import { Protocol } from "../constants";

import { iAsc } from "~/lib/drizzle";
import { omitKeys } from "~/utils/object";

/**
 * Returns media stored on the device locally, which is managed by our
 * SQLite database.
 */
export const LocalMediaAdapter: Adapter = {
  protocol: Protocol.LOCAL,

  //#region getAlbums
  async getAlbums() {
    const results = await db
      .select({
        ...albumFields,
        duration: sum(tracks.duration),
        trackCount: count(tracks.id),
      })
      .from(albums)
      .innerJoin(tracks, eq(albums.id, tracks.albumId))
      .groupBy(albums.name)
      .orderBy(iAsc(albums.name), iAsc(albums.artistsKey));

    return results
      .map((album) => ({
        ...toBaseListObject(album),
        artist: AlbumArtistsKey.toString(album.artistsKey),
        artists: AlbumArtistsKey.deconstruct(album.artistsKey).map(
          (artistName) => ({ id: artistName, name: artistName }),
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  //#endregion

  //#region getAlbum
  async getAlbum() {
    throw new Error("`getAlbum` is unimplemented.");
  },
  //#endregion

  //#region getArtists
  async getArtists() {
    const results = await db
      .select({
        ...getTableColumns(artists),
        duration: sum(tracks.duration),
        trackCount: count(tracks.id),
      })
      .from(artists)
      .innerJoin(tracksToArtists, eq(artists.name, tracksToArtists.artistName))
      .innerJoin(tracks, eq(tracksToArtists.trackId, tracks.id))
      .groupBy(artists.name)
      .orderBy(iAsc(artists.name));

    return results
      .map(toBaseListObject)
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  //#endregion

  //#region getArtist
  async getArtist() {
    throw new Error("`getArtist` is unimplemented.");
  },
  //#endregion

  //#region getFolder
  async getFolder() {
    throw new Error("`getFolder` is unimplemented.");
  },
  //#endregion

  //#region getGenres
  async getGenres() {
    const results = await db
      .select({
        ...getTableColumns(genres),
        duration: sum(tracks.duration),
        trackCount: count(tracks.id),
      })
      .from(genres)
      .innerJoin(tracksToGenres, eq(genres.name, tracksToGenres.genreName))
      .innerJoin(tracks, eq(tracksToGenres.trackId, tracks.id))
      .groupBy(genres.name)
      .orderBy(iAsc(genres.name));

    return results
      .map(toBaseListObject)
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  //#endregion

  //#region getGenre
  async getGenre() {
    throw new Error("`getGenre` is unimplemented.");
  },
  //#endregion

  //#region getPlaylists
  async getPlaylists() {
    const results = await db
      .select({
        ...playlistFields,
        duration: sum(tracks.duration),
        trackCount: count(tracks.id),
      })
      .from(playlists)
      .innerJoin(
        tracksToPlaylists,
        eq(playlists.name, tracksToPlaylists.playlistName),
      )
      .innerJoin(tracks, eq(tracksToPlaylists.trackId, tracks.id))
      .groupBy(playlists.name)
      .orderBy(iAsc(playlists.name));

    return results
      .map(toBaseListObject)
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  //#endregion

  //#region getPlaylist
  async getPlaylist() {
    throw new Error("`getPlaylist` is unimplemented.");
  },
  //#endregion

  //#region getTracks
  async getTracks() {
    return [];
  },
  //#endregion

  //#region getTrack
  async getTrack() {
    throw new Error("`getTrack` is unimplemented.");
  },
  //#endregion

  //#region getTrackStats
  async getTrackStats() {
    throw new Error("`getTrackStats` is unimplemented.");
  },
  //#endregion
};

//#region Internal Utils
const albumFields = omitKeys(getTableColumns(albums), [
  "altArtwork",
  "embeddedArtwork",
  "isFavorite",
]);

const playlistFields = omitKeys(getTableColumns(playlists), ["isFavorite"]);

/** Reformats data used in a list to its shared repesentation. */
function toBaseListObject(data: {
  id?: string;
  name: string;
  artwork: string | null;
  duration: string | null;
  trackCount: number;
}) {
  return {
    id: data.id ?? data.name,
    protocol: Protocol.LOCAL,
    name: data.name,
    artworkSrc: data.artwork,
    duration: Number(data.duration) || 0,
    trackCount: data.trackCount,
  };
}
//#endregion
