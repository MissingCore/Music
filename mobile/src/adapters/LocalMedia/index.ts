import { eq, max, min } from "drizzle-orm";

import { db } from "~/db";
import { tracks } from "~/db/schema";

import { Protocol } from "../core/constants";
import type { Adapter } from "../core/types";

import { iAsc, throwIfNoResults } from "~/lib/drizzle";
import {
  toAlbumListObject,
  toBaseListObject,
  toBaseTrackObject,
} from "./formatters";
import {
  albumListsView,
  artistListsView,
  genreListsView,
  playlistListsView,
  sharedTrackColumns,
  structuredTracksView,
} from "./views";

/**
 * Returns media stored on the device locally, which is managed by our
 * SQLite database.
 */
export const LocalMediaAdapter: Adapter = {
  protocol: Protocol.LOCAL,

  //#region getAlbums
  async getAlbums() {
    const results = await db.select().from(albumListsView);
    return results
      .map(toAlbumListObject)
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  //#endregion

  //#region getAlbum
  async getAlbum(id) {
    const [[details], [range], albumTracks] = await Promise.all([
      throwIfNoResults(
        db.select().from(albumListsView).where(eq(albumListsView.id, id)),
        "err.msg.noAlbums",
      ),
      db
        .select({ minYear: min(tracks.year), maxYear: max(tracks.year) })
        .from(tracks)
        .where(eq(tracks.albumId, id)),
      db
        .select({
          ...sharedTrackColumns,
          disc: structuredTracksView.disc,
          track: structuredTracksView.track,
        })
        .from(structuredTracksView)
        .where(eq(structuredTracksView.albumId, id))
        .orderBy(
          iAsc(structuredTracksView.disc),
          iAsc(structuredTracksView.track),
        ),
    ]);
    if (!details) throw new Error("[getAlbum] This check should never run.");

    let yearStr: string | null = null;
    if (range && range.minYear !== null && range.maxYear !== null) {
      if (range.minYear === range.maxYear) yearStr = `${range.maxYear}`;
      else yearStr = `${range.minYear} - ${range.maxYear}`;
    }

    return {
      ...toAlbumListObject(details),
      year: yearStr,
      tracks: albumTracks.map((track) => ({
        ...toBaseTrackObject(track),
        disc: track.disc,
        track: track.track,
      })),
    };
  },
  //#endregion

  //#region getArtists
  async getArtists() {
    const results = await db.select().from(artistListsView);
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
    const results = await db.select().from(genreListsView);
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
    const results = await db.select().from(playlistListsView);
    return results
      .map((playlist) => ({
        ...toBaseListObject(playlist),
        isFavorite: playlist.isFavorite,
      }))
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
