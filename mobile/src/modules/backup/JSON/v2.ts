// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { eq, inArray, isNotNull, sql } from "drizzle-orm";
import { z } from "zod/mini";

import { db } from "~/db";
import type { Album } from "~/db/schema";
import {
  albums,
  artists,
  genres,
  playlists,
  tracks,
  tracksToArtists,
  tracksToGenres,
} from "~/db/schema";

import i18next from "~/modules/i18n";
import { getAlbumsSummary, updateAlbum, upsertAlbums } from "~/data/album/api";
import {
  createPlaylist,
  getPlaylistsSummary,
  updatePlaylist,
} from "~/data/playlist/api";
import { sanitizePlaylistName } from "~/data/playlist/utils";
import { mergeTracks } from "~/data/track/utils";
import { fromJSONArrayString } from "~/data/utils";
import { structuredTracksView } from "~/data/views";

import { getSubqueryFields } from "~/lib/drizzle";
import { pickDirectory } from "~/lib/file-system";
import { pickKeys } from "~/utils/object";
import { ZSchema } from "~/modules/form/utils";
import { getArtworkHash } from "~/modules/scanning/helpers/artwork";

//#region Schemas
const PlaylistNameSchema = z.pipe(
  z.string(),
  z.transform(sanitizePlaylistName),
);

const AlbumSchema = z.object({
  name: ZSchema.NonEmptyString,
  // We can derive the album artists from this.
  artistsKey: ZSchema.NonEmptyString,
});

const TrackSchema = z.object({
  uri: ZSchema.NonEmptyString,
});

const TrackMetadataSchema = z.object({
  ...TrackSchema.shape,
  editedMetadata: ZSchema.RealNumber,
  name: ZSchema.NonEmptyString,
  artists: z.array(ZSchema.NonEmptyString),
  album: z.nullable(AlbumSchema),
  disc: ZSchema.NullableRealNumber,
  track: ZSchema.NullableRealNumber,
  year: ZSchema.NullableRealNumber,
  genres: z.array(ZSchema.NonEmptyString),
});

const BackupSchema = z.object({
  version: ZSchema.RealNumber,
  exportedAt: ZSchema.NonEmptyString,

  backup: z.object({
    trackMetadata: z.array(TrackMetadataSchema),
    // "Favorited Tracks" will be exported as a playlist.
    playlists: z.array(
      z.object({
        name: PlaylistNameSchema,
        tracks: z.array(TrackSchema),
      }),
    ),
    favorites: z.object({
      albums: z.array(AlbumSchema),
      playlists: z.array(PlaylistNameSchema),
    }),
  }),
});
//#endregion

//#region Export
export async function exportBackupV2() {
  const [favAlbums, favPlaylists, allPlaylists, editedTracks] =
    await Promise.all([
      // Get favorited values.
      getAlbumsSummary(false, [eq(albums.isFavorite, true)]),
      getPlaylistsSummary(false, [eq(playlists.isFavorite, true)]),
      // Get all user-generated playlists.
      getPlaylistsSummary(true),
      // Get all user-edited tracks.
      (async () => {
        const results = await db
          .select({
            ...pickKeys(getSubqueryFields(structuredTracksView), [
              "uri",
              "editedMetadata",
              "name",
              "artists",
              "albumName",
              "albumArtistsKey",
              "disc",
              "track",
              "year",
            ] as const),
            /** We need to unencode these fields. */
            genres: sql<
              string | null
            >`NULLIF(json_group_array(${tracksToGenres.genreName}), '[null]')`.as(
              "derived_genres",
            ),
          })
          .from(structuredTracksView)
          .leftJoin(
            tracksToGenres,
            eq(structuredTracksView.id, tracksToGenres.trackId),
          )
          .groupBy(structuredTracksView.id)
          .where(isNotNull(structuredTracksView.editedMetadata));

        return results.map(({ artists, genres, ...rest }) => ({
          ...rest,
          artists: fromJSONArrayString(artists) ?? [],
          genres: fromJSONArrayString(genres) ?? [],
        }));
      })(),
    ]);

  // User selects location to save this backup file.
  const dir = await pickDirectory();

  // Create a new file in specified directory & write contents.
  const backupFile = dir.createFile("music_backup_v2", "application/json");
  backupFile.write(
    JSON.stringify({
      version: 2,
      exportedAt: new Date().toString(),

      backup: {
        trackMetadata: editedTracks.map(
          ({ albumName, albumArtistsKey, ...rest }) => ({
            ...rest,
            editedMetadata: rest.editedMetadata!,
            album:
              albumName && albumArtistsKey
                ? { name: albumName, artistsKey: albumArtistsKey }
                : null,
          }),
        ),
        playlists: allPlaylists.map(({ id, tracks }) => ({
          name: id,
          tracks: tracks.map(({ uri }) => ({ uri })),
        })),
        favorites: {
          albums: favAlbums.map(({ name, artistsKey }) => {
            return { name, artistsKey };
          }),
          playlists: favPlaylists.map(({ id }) => id),
        },
      },
    } satisfies z.infer<typeof BackupSchema>),
  );
}
//#endregion

//#region Import
export async function importBackupV2(jsonContent: Record<string, any>) {
  // Read, parse, and validate file contents.
  let _backupContents;
  try {
    // Validate the data structure.
    _backupContents = BackupSchema.parse(jsonContent);
  } catch {
    throw new Error(i18next.t("err.msg.invalidStructure"));
  }
  const backupContents = _backupContents.backup;

  const allTracks = await db.query.tracks.findMany({
    columns: { id: true, uri: true },
  });
  const trackIdLookUpTable = Object.fromEntries(
    allTracks.map((t) => [t.uri, t.id]),
  );

  const allAlbums = await db.query.albums.findMany({
    columns: { id: true, name: true, artistsKey: true },
  });
  const albumIdLookUpTable: Record<string, Record<string, string>> = {};
  allAlbums.forEach(({ id, name, artistsKey }) => {
    if (albumIdLookUpTable[artistsKey])
      albumIdLookUpTable[artistsKey][name] = id;
    else albumIdLookUpTable[artistsKey] = { [name]: id };
  });

  const allPlaylists = await db.query.playlists.findMany({
    columns: { name: true },
    with: {
      tracksToPlaylists: {
        orderBy: (fields, { asc }) => asc(fields.position),
      },
    },
  });
  const playlistLookupTable: Record<string, string[]> = {};
  allPlaylists.forEach(({ name, tracksToPlaylists }) => {
    playlistLookupTable[name] = tracksToPlaylists.map((t) => t.trackId);
  });

  //? 1. Update track metadata.
  //? 1a. Create album entries before we do anything else.
  const albumEntries = backupContents.trackMetadata
    .map((t) => t.album)
    .filter((al) => al !== null);
  let createdAlbums: Album[] = [];
  if (albumEntries.length > 0) {
    createdAlbums = await upsertAlbums(albumEntries);
    createdAlbums.forEach(({ id, name, artistsKey }) => {
      if (albumIdLookUpTable[artistsKey])
        albumIdLookUpTable[artistsKey][name] = id;
      else albumIdLookUpTable[artistsKey] = { [name]: id };
    });
  }

  //? 1b. Find the things we need to insert.
  const artistNames = new Set<string>();
  const genreNames = new Set<string>();

  const trackArtistRels: Array<{ trackId: string; artistName: string }> = [];
  const trackGenreRels: Array<{ trackId: string; genreName: string }> = [];

  const trackEntries: Array<{
    id: string;
    name: string;
    albumId: string | null;
    disc: number | null;
    track: number | null;
    year: number | null;
    editedMetadata: number;
  }> = [];

  for (const metadata of backupContents.trackMetadata) {
    const trackId = trackIdLookUpTable[metadata.uri];
    if (!trackId) continue;

    // We handle album-to-artists relations in `upsertAlbums()`.
    let albumId: string | undefined;
    if (metadata.album) {
      const { artistsKey, name } = metadata.album;
      albumId = albumIdLookUpTable[artistsKey]?.[name];
    }

    metadata.artists.forEach((artistName) => {
      artistNames.add(artistName);
      trackArtistRels.push({ trackId, artistName });
    });

    metadata.genres.forEach((genreName) => {
      genreNames.add(genreName);
      trackGenreRels.push({ trackId, genreName });
    });

    trackEntries.push({
      id: trackId,
      name: metadata.name,
      albumId: albumId || null,
      disc: metadata.disc,
      track: metadata.track,
      year: metadata.year,
      editedMetadata: metadata.editedMetadata,
    });
  }

  //? 1c. Insert relations.
  if (artistNames.size > 0)
    await db
      .insert(artists)
      .values(Array.from(artistNames).map((name) => ({ name })))
      .onConflictDoNothing();

  if (genreNames.size > 0)
    await db
      .insert(genres)
      .values(Array.from(genreNames).map((name) => ({ name })))
      .onConflictDoNothing();

  if (trackArtistRels.length > 0) {
    const oldRels = trackArtistRels.map((rel) => rel.trackId);
    await db.transaction(async (tx) => {
      await tx
        .delete(tracksToArtists)
        .where(inArray(tracksToArtists.trackId, oldRels));
      await tx
        .insert(tracksToArtists)
        .values(trackArtistRels)
        .onConflictDoNothing();
    });
  }

  if (trackGenreRels.length > 0) {
    const oldRels = trackGenreRels.map((rel) => rel.trackId);
    await db.transaction(async (tx) => {
      await tx
        .delete(tracksToGenres)
        .where(inArray(tracksToGenres.trackId, oldRels));
      await tx
        .insert(tracksToGenres)
        .values(trackGenreRels)
        .onConflictDoNothing();
    });
  }

  for (const { id: trackId, ...trackEntry } of trackEntries) {
    await db.update(tracks).set(trackEntry).where(eq(tracks.id, trackId));
  }

  //? 2. Import playlists.
  await Promise.allSettled(
    backupContents.playlists.map(async ({ name, tracks: plTracks }) => {
      const exists = playlistLookupTable[name];
      const _playlistTracks = plTracks
        .map(({ uri }) => trackIdLookUpTable[uri])
        .filter((id) => id !== undefined);
      // Remove any duplicates.
      const playlistTracks = Array.from(new Set(_playlistTracks)).map(
        (tId) => ({ id: tId }),
      );

      // Create or update playlist to have the current track order.
      if (exists) {
        await updatePlaylist(name, {
          tracks: mergeTracks(
            exists.map((tId) => ({ id: tId })),
            playlistTracks,
          ),
        });
      } else await createPlaylist({ name, tracks: playlistTracks });
    }),
  );

  //? 3. Favorite albums, playlists, and tracks (via `favorites` playlist).
  const albumsToFavorite: string[] = [];
  for (const { name, artistsKey } of backupContents.favorites.albums) {
    const albumId = albumIdLookUpTable[artistsKey]?.[name];
    if (albumId) albumsToFavorite.push(albumId);
  }

  if (albumsToFavorite.length > 0)
    await db
      .update(albums)
      .set({ isFavorite: true })
      .where(inArray(albums.id, albumsToFavorite));

  if (backupContents.favorites.playlists.length > 0)
    await db
      .update(playlists)
      .set({ isFavorite: true })
      .where(inArray(playlists.name, backupContents.favorites.playlists));

  //? 4. Since we may have created new albums, ensure they have artwork.
  const albumsWithoutArtwork = createdAlbums
    .filter((a) => a.embeddedArtwork === null)
    .map((a) => a.id);

  if (albumsWithoutArtwork.length > 0) {
    // Determine list of tracks we can infer the album artwork from.
    const albumArtworkSources = await db.query.tracks.findMany({
      columns: { albumId: true, uri: true },
      where: (fields, { inArray }) =>
        inArray(fields.albumId, albumsWithoutArtwork),
    });
    const albumTrackMap: Record<string, string[]> = {};
    for (const { albumId, uri } of albumArtworkSources) {
      if (!albumId) continue;
      if (albumTrackMap[albumId]) albumTrackMap[albumId].push(uri);
      else albumTrackMap[albumId] = [uri];
    }

    // Get list of previously hashed images.
    const prevHashedImages = await db.query.hashedImages.findMany();
    const knownHashes = new Set(prevHashedImages.map((h) => h.hash));

    for (const [albumId, albumTracks] of Object.entries(albumTrackMap)) {
      // This inner loop will most likely iterate once.
      for (const trackUri of albumTracks) {
        const { artworkHash } = await getArtworkHash(trackUri, knownHashes);
        if (artworkHash) {
          const data = { embeddedArtwork: artworkHash };
          await updateAlbum(albumId, data);
          break;
        }
      }
    }
  }
}
//#endregion
