import { eq, getTableColumns, max, min, sum, count } from "drizzle-orm";

import { db } from "~/db";
import {
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

import { iAsc, throwIfNoResults } from "~/lib/drizzle";
import { omitKeys } from "~/utils/object";
import type { StructuredTracksResult } from "./views";
import {
  albumListsView,
  sharedTrackColumns,
  structuredTracksView,
} from "./views";

const _AdapterProtocol = Protocol.LOCAL;

/**
 * Returns media stored on the device locally, which is managed by our
 * SQLite database.
 */
export const LocalMediaAdapter: Adapter = {
  protocol: _AdapterProtocol,

  //#region getAlbums
  async getAlbums() {
    const results = await db.select().from(albumListsView);
    return results
      .map((album) => ({
        ...toBaseListObject(album),
        artist: AlbumArtistsKey.toString(album.artistsKey),
        artists: AlbumArtistsKey.deconstruct(album.artistsKey).map(
          (artistName) => ({ id: artistName, name: artistName }),
        ),
        isFavorite: album.isFavorite,
      }))
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
      ...toBaseListObject(details),
      artist: AlbumArtistsKey.toString(details.artistsKey),
      artists: AlbumArtistsKey.deconstruct(details.artistsKey).map((name) => {
        return { id: name, name };
      }),
      isFavorite: details.isFavorite,
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
    protocol: _AdapterProtocol,
    name: data.name,
    artworkSrc: data.artwork,
    duration: Number(data.duration) || 0,
    trackCount: data.trackCount,
  };
}

/** Reformats track data to its shared repesentation. */
function toBaseTrackObject(
  data: Pick<StructuredTracksResult, keyof typeof sharedTrackColumns>,
) {
  const trackArtists = data.artists
    ? (JSON.parse(data.artists) as string[])
    : null;
  return {
    id: data.id ?? data.name,
    protocol: _AdapterProtocol,
    name: data.name,
    artworkSrc: data.artwork,
    src: data.uri,
    duration: data.duration,
    artist: data.artistsName,
    artists:
      trackArtists && trackArtists.length > 0
        ? trackArtists.map((name) => ({ id: name, name }))
        : null,
    album: data.albumName,
    albumId: data.albumId,
    discoverTime: data.discoverTime,
    modificationTime: data.modificationTime,
    parent: data.parentFolder,
  };
}
//#endregion
