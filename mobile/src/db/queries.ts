import type { SQL } from "drizzle-orm";
import { and, eq } from "drizzle-orm";

import { db } from ".";
import type { TrackWithAlbum } from "./schema";
import { albums, tracks, tracksToPlaylists } from "./schema";
import { fixPlaylistJunction, getTrackCover } from "./utils/formatters";

import { deleteFile } from "@/lib/file-system";
import { addTrailingSlash } from "@/utils/string";
import type { Maybe } from "@/utils/types";
import type { ReservedPlaylistName } from "@/modules/media/constants";
import { ReservedPlaylists } from "@/modules/media/constants";

type DrizzleFilter = Array<SQL | undefined>;

//#region Album
/** Upsert a new album, returning the created value. */
export async function createAlbum(entry: typeof albums.$inferInsert) {
  return (
    await db
      .insert(albums)
      .values(entry)
      .onConflictDoUpdate({
        target: [albums.name, albums.artistName, albums.releaseYear],
        set: entry,
      })
      .returning()
  )[0];
}

/** Throws error if no album is found. */
export async function getAlbum(filters: DrizzleFilter) {
  const album = await db.query.albums.findFirst({
    where: and(...(filters ?? [])),
    with: { tracks: true },
  });
  if (!album) throw new Error("Album doesn't exist.");
  return album;
}

export async function getAlbums(filters?: DrizzleFilter) {
  return await db.query.albums.findMany({
    where: and(...(filters ?? [])),
    with: { tracks: true },
  });
}
//#endregion

//#region Artist
/** Throws error if no artist is found. */
export async function getArtist(filters: DrizzleFilter) {
  const artist = await db.query.artists.findFirst({
    where: and(...(filters ?? [])),
    with: { tracks: { with: { album: true } } },
  });
  if (!artist) throw new Error("Artist doesn't exist.");
  return artist;
}

export async function getArtists(filters?: DrizzleFilter) {
  return await db.query.artists.findMany({
    where: and(...(filters ?? [])),
    with: { tracks: { with: { album: true } } },
  });
}
//#endregion

//#region Playlist
/** Throws error if no playlist is found. */
export async function getPlaylist(filters: DrizzleFilter) {
  const playlist = await db.query.playlists.findFirst({
    where: and(...(filters ?? [])),
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

export async function getPlaylists(filters?: DrizzleFilter) {
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

/** Returns tracks in a `SpecialPlaylist` formatted as `PlaylistWithTracks`. */
export async function getSpecialPlaylist(name: ReservedPlaylistName) {
  const _tracks = await getTracks(
    ReservedPlaylists.favorites === name
      ? [eq(tracks.isFavorite, true)]
      : undefined,
  );
  return {
    ...{ name, isFavorite: false, tracks: _tracks },
    artwork: ReservedPlaylists.favorites ? name : null,
  };
}
//#endregion

//#region Track
/** Deletes a track along with its relation to any playlist. */
export async function deleteTrack(trackId: string) {
  await db.transaction(async (tx) => {
    await tx
      .delete(tracksToPlaylists)
      .where(eq(tracksToPlaylists.trackId, trackId));
    const [deletedTrack] = await tx
      .delete(tracks)
      .where(eq(tracks.id, trackId))
      .returning({ artwork: tracks.artwork });
    // Make sure to delete the track artwork.
    await deleteFile(deletedTrack?.artwork);
  });
}

/** Throws error if no track is found. */
export async function getTrack(filters: DrizzleFilter) {
  const track = await db.query.tracks.findFirst({
    where: and(...(filters ?? [])),
    with: { album: true },
  });
  if (!track) throw new Error("Track doesn't exist.");
  return { ...track, artwork: getTrackCover(track) };
}

export async function getTracks(filters?: DrizzleFilter) {
  const data = await db.query.tracks.findMany({
    where: and(...(filters ?? [])),
    with: { album: true },
  });
  return data.map((track) => ({ ...track, artwork: getTrackCover(track) }));
}
//#endregion

//#region Folder
/** Get the direct subdirectories & tracks in the folder. */
export async function getFolder(_path: Maybe<string>) {
  const path = _path ? addTrailingSlash(_path) : null;

  // Find direct subdirectories with content.
  const subDirs = await db.query.fileNodes.findMany({
    where: (fields, { eq, isNull }) =>
      path ? eq(fields.parentPath, path) : isNull(fields.parentPath),

    orderBy: (fields, { asc }) => asc(fields.name),
  });
  const dirHasChild = await Promise.all(
    subDirs.map(({ path: subDir }) =>
      db.query.tracks.findFirst({
        where: (fields, { like }) => like(fields.uri, `file:///${subDir}%`),
        columns: { id: true },
      }),
    ),
  );
  const directSubDirs = subDirs.filter((_, idx) => !!dirHasChild[idx]);

  // Find direct tracks in the folder.
  let folderTracks: TrackWithAlbum[] = [];
  if (path) {
    const fullPath = `file:///${path}`;
    const orderdTracks = await db.query.tracks.findMany({
      where: (fields, { like }) => like(fields.uri, `${fullPath}%`),
      with: { album: true },
      orderBy: (fields, { asc }) => asc(fields.name),
    });
    // Exclude tracks in the subdirectories of this folder.
    folderTracks = orderdTracks.filter(
      ({ uri }) => !uri.slice(fullPath.length).includes("/"),
    );
  }

  return { subDirectories: directSubDirs, tracks: folderTracks };
}
//#endregion
