import { eq } from "drizzle-orm";

import { db } from "~/db";
import { albumsToArtists, tracksToArtists } from "~/db/schema";

import { Protocol } from "../core/constants";
import type { Adapter } from "../core/types";

import { getSubqueryFields, iAsc, throwIfNoResults } from "~/lib/drizzle";
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
    const [[details], albumTracks] = await Promise.all([
      throwIfNoResults(
        db.select().from(albumListsView).where(eq(albumListsView.id, id)),
        "err.msg.noAlbums",
      ),
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

    return {
      ...toAlbumListObject(details),
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
  async getArtist(id) {
    const [[details], artistAlbums, artistTracks] = await Promise.all([
      throwIfNoResults(
        db.select().from(artistListsView).where(eq(artistListsView.name, id)),
        "err.msg.noArtists",
      ),
      db
        .select(getSubqueryFields(albumListsView))
        .from(albumsToArtists)
        .where(eq(albumsToArtists.artistName, id))
        .innerJoin(
          albumListsView,
          eq(albumsToArtists.albumId, albumListsView.id),
        ),
      db
        .select(sharedTrackColumns)
        .from(tracksToArtists)
        .where(eq(tracksToArtists.artistName, id))
        .innerJoin(
          structuredTracksView,
          eq(tracksToArtists.trackId, structuredTracksView.id),
        )
        .orderBy(iAsc(structuredTracksView.name)),
    ]);
    if (!details) throw new Error("[getArtist] This check should never run.");

    const sortedAlbums = artistAlbums.sort(
      (a, b) =>
        (b.maxYear ?? -1) - (a.maxYear ?? -1) ||
        (b.minYear ?? -1) - (a.minYear ?? -1),
    );

    return {
      ...toBaseListObject(details),
      albums: sortedAlbums.map(toAlbumListObject),
      tracks: artistTracks.map(toBaseTrackObject),
    };
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
