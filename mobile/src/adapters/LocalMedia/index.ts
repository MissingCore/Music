import type { Adapter } from "../types";

/**
 * Returns media stored on the device locally, which is managed by our
 * SQLite database.
 */
export const LocalMediaAdapter: Adapter = {
  async getAlbums() {
    return [];
  },
  async getAlbum() {
    throw new Error("`getAlbum` is unimplemented.");
  },

  async getArtists() {
    return [];
  },
  async getArtist() {
    throw new Error("`getArtist` is unimplemented.");
  },

  async getFolder() {
    throw new Error("`getFolder` is unimplemented.");
  },

  async getGenres() {
    return [];
  },
  async getGenre() {
    throw new Error("`getGenre` is unimplemented.");
  },

  async getPlaylists() {
    return [];
  },
  async getPlaylist() {
    throw new Error("`getPlaylist` is unimplemented.");
  },

  async getTracks() {
    return [];
  },
  async getTrack() {
    throw new Error("`getTrack` is unimplemented.");
  },
  async getTrackStats() {
    throw new Error("`getTrackStats` is unimplemented.");
  },
};
