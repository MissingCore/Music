import { eq } from "drizzle-orm";

import { db } from "~/db";
import {
  albumsToArtists,
  tracksToArtists,
  tracksToGenres,
  tracksToPlaylists,
} from "~/db/schema";

import { getFolderDirectories } from "~/data/folder/api";

import { Protocol } from "../core/constants";
import type { Adapter } from "../core/types";

import { getSubqueryFields, iAsc, throwIfNoResults } from "~/lib/drizzle";
import { addTrailingSlash } from "~/utils/string";
import {
  toAlbumListObject,
  toBaseListObject,
  toBaseTrackObject,
  toPlaylistListObject,
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
  async getFolder(path) {
    const [details, directories, folderTracks] = await Promise.all([
      path
        ? db.query.fileNodes.findFirst({
            where: (fields, { eq }) => eq(fields.path, path),
          })
        : undefined,
      getFolderDirectories(path),
      path
        ? db
            .select(sharedTrackColumns)
            .from(structuredTracksView)
            .where(
              eq(
                structuredTracksView.parentFolder,
                `file:///${addTrailingSlash(path)}`,
              ),
            )
            .orderBy(iAsc(structuredTracksView.name))
        : [],
    ]);

    return {
      id: path,
      protocol: this.protocol,
      name: details?.name ?? "",
      artworkSrc: null,
      parent: details?.parentPath,
      subDirs: directories.map(({ name }) => ({ id: name, name })),
      tracks: folderTracks.map(toBaseTrackObject),
    };
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
  async getGenre(id) {
    const [[details], genreTracks] = await Promise.all([
      throwIfNoResults(
        db.select().from(genreListsView).where(eq(genreListsView.name, id)),
        "err.msg.noGenres",
      ),
      db
        .select(sharedTrackColumns)
        .from(tracksToGenres)
        .where(eq(tracksToGenres.genreName, id))
        .innerJoin(
          structuredTracksView,
          eq(tracksToGenres.trackId, structuredTracksView.id),
        )
        .orderBy(iAsc(structuredTracksView.name)),
    ]);
    if (!details) throw new Error("[getGenre] This check should never run.");

    return {
      ...toBaseListObject(details),
      tracks: genreTracks.map(toBaseTrackObject),
    };
  },
  //#endregion

  //#region getPlaylists
  async getPlaylists() {
    const results = await db.select().from(playlistListsView);
    return results
      .map(toPlaylistListObject)
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  //#endregion

  //#region getPlaylist
  async getPlaylist(id) {
    const [[details], playlistTracks] = await Promise.all([
      throwIfNoResults(
        db
          .select()
          .from(playlistListsView)
          .where(eq(playlistListsView.name, id)),
        "err.msg.noPlaylists",
      ),
      db
        .select(sharedTrackColumns)
        .from(tracksToPlaylists)
        .where(eq(tracksToPlaylists.playlistName, id))
        .innerJoin(
          structuredTracksView,
          eq(tracksToPlaylists.trackId, structuredTracksView.id),
        )
        .orderBy(iAsc(tracksToPlaylists.position)),
    ]);
    if (!details) throw new Error("[getPlaylist] This check should never run.");

    return {
      ...toPlaylistListObject(details),
      tracks: playlistTracks.map(toBaseTrackObject),
    };
  },
  //#endregion

  //#region getTracks
  async getTracks() {
    const results = await db.select().from(structuredTracksView);
    return results.map(toBaseTrackObject);
  },
  //#endregion

  //#region getTrack
  async getTrack(id) {
    const [result] = await throwIfNoResults(
      db
        .select(sharedTrackColumns)
        .from(structuredTracksView)
        .where(eq(structuredTracksView.id, id)),
    );
    if (!result) throw new Error("[getTrack] This check should never run.");

    return toBaseTrackObject(result);
  },
  //#endregion

  //#region getTrackStats
  async getTrackStats(trackId) {
    const { format, ...stats } = await throwIfNoResults(
      db.query.tracks.findFirst({
        where: (fields, { eq }) => eq(fields.id, trackId),
        columns: { format: true, bitrate: true, sampleRate: true, size: true },
      }),
    );

    return { ...stats, trackId, protocol: this.protocol, contentType: format };
  },
  //#endregion
};
