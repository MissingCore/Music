import { Protocol } from "../core/constants";
import type { Adapter } from "../core/types";

/**
 * Example on the structure of an adapter.
 *
 * @deprecated This should not be used.
 */
export const ExampleAdapter: Adapter = {
  protocol: Protocol.EXAMPLE,

  //#region getAlbums
  async getAlbums() {
    return [];
  },
  //#endregion

  //#region getAlbum
  async getAlbum() {
    throw new Error("`getAlbum` is unimplemented.");
  },
  //#endregion

  //#region getArtists
  async getArtists() {
    return [];
  },
  //#endregion

  //#region getArtist
  async getArtist() {
    throw new Error("`getArtist` is unimplemented.");
  },
  //#endregion

  //#region getArtistTracks
  async getArtistTracks() {
    throw new Error("`getArtistTracks` is unimplemented.");
  },
  //#endregion

  //#region getFolder
  async getFolder() {
    throw new Error("`getFolder` is unimplemented.");
  },
  //#endregion

  //#region getFolderTracks
  async getFolderTracks() {
    throw new Error("`getFolderTracks` is unimplemented.");
  },
  //#endregion

  //#region getGenres
  async getGenres() {
    return [];
  },
  //#endregion

  //#region getGenre
  async getGenre() {
    throw new Error("`getGenre` is unimplemented.");
  },
  //#endregion

  //#region getGenreTracks
  async getGenreTracks() {
    throw new Error("`getGenreTracks` is unimplemented.");
  },
  //#endregion

  //#region getPlaylists
  async getPlaylists() {
    return [];
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
