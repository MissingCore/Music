// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { eq, isNotNull, sql } from "drizzle-orm";
import { z } from "zod/mini";

import { db } from "~/db";
import { albums, playlists, tracksToGenres } from "~/db/schema";

import { getAlbumsSummary } from "~/data/album/api";
import { getPlaylistsSummary } from "~/data/playlist/api";
import { sanitizePlaylistName } from "~/data/playlist/utils";
import { fromJSONArrayString } from "~/data/utils";
import { structuredTracksView } from "~/data/views";

import { getSubqueryFields } from "~/lib/drizzle";
import { pickDirectory } from "~/lib/file-system";
import { pickKeys } from "~/utils/object";
import { ZSchema } from "~/modules/form/utils";

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
export async function importBackupV2(jsonContent: Record<string, any>) {}
//#endregion
