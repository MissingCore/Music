// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { inArray } from "drizzle-orm";
import { z } from "zod/mini";

import { db } from "~/db";
import { albums, playlists } from "~/db/schema";

import i18next from "~/modules/i18n";
import { getAlbumsSummary } from "~/data/album/api";
import {
  createPlaylist,
  getPlaylistsSummary,
  updatePlaylist,
} from "~/data/playlist/api";
import { sanitizePlaylistName } from "~/data/playlist/utils";
import { getTracks } from "~/data/track/api";
import { mergeTracks } from "~/data/track/utils";

import { pickFile } from "~/lib/file-system";
import { ZSchema } from "~/modules/form/utils";
import { FavoritesPlaylistKey } from "~/modules/media/constants";

//#region Schemas
const NullableNonEmptyStringSchema = z.nullish(ZSchema.NonEmptyString);
const PlaylistNameSchema = z.pipe(
  z.string(),
  z.transform(sanitizePlaylistName),
);

const RawAlbum = z.object({
  name: ZSchema.NonEmptyString,
  artistName: ZSchema.NonEmptyString,
});

const RawTrack = z.object({
  name: ZSchema.NonEmptyString,
  artistName: NullableNonEmptyStringSchema,
  albumName: NullableNonEmptyStringSchema,
});

const MusicBackup = z.object({
  favorites: z.object({
    albums: z.array(RawAlbum),
    playlists: z.array(PlaylistNameSchema),
    /** @deprecated For backwards compatibility. */
    tracks: z.array(RawTrack),
  }),
  playlists: z.array(
    z.object({
      name: PlaylistNameSchema,
      tracks: z.array(RawTrack),
    }),
  ),
});
//#endregion

//#region Helpers
/** Creates a factory function that finds albums associated to `RawAlbum`. */
async function findExistingAlbumsFactory() {
  const allAlbums = await getAlbumsSummary();
  return (entries: Array<z.infer<typeof RawAlbum>>) => {
    return entries
      .map((entry) =>
        allAlbums.find(
          // `artistsKey` will initially be the old `artistName` value until
          // separators are applied via "Deep Rescan".
          (t) => t.name === entry.name && t.artistsKey === entry.artistName,
        ),
      )
      .filter((entry) => entry !== undefined);
  };
}

/** Creates a factory function that finds tracks associated to `RawTrack`. */
async function findExistingTracksFactory() {
  const allTracks = await getTracks();
  return (entries: Array<z.infer<typeof RawTrack>>) => {
    return entries
      .map((entry) =>
        allTracks.find(
          (t) =>
            t.name === entry.name &&
            t.rawArtistName === entry.artistName &&
            t.albumName === (entry.albumName || null),
        ),
      )
      .filter((entry) => entry !== undefined);
  };
}
//#endregion

//#region Import
export async function importBackup() {
  const backupFile = await pickFile([
    "application/json",
    "application/octet-stream",
  ]);

  // Read, parse, and validate file contents.
  let backupContents;
  try {
    // Validate the data structure.
    backupContents = MusicBackup.parse(await backupFile.json());
  } catch {
    throw new Error(i18next.t("err.msg.invalidStructure"));
  }

  const allPlaylists = await getPlaylistsSummary(true);

  const findExistingAlbums = await findExistingAlbumsFactory();
  const findExistingTracks = await findExistingTracksFactory();

  // Import playlists.
  //! [Deprecated] For backwards compatibility, add `favorites.tracks` as a
  //! "Favorite Tracks" playlist.
  const importedPlaylists = backupContents.playlists.concat([
    { name: FavoritesPlaylistKey, tracks: backupContents.favorites.tracks },
  ]);
  await Promise.allSettled(
    importedPlaylists.map(async ({ name, tracks: plTracks }) => {
      const exists = allPlaylists.find((pl) => pl.id === name);
      const _playlistTracks = findExistingTracks(plTracks);
      // Remove any duplicates.
      const playlistTracks = Array.from(
        new Set(_playlistTracks.map((t) => t.id)),
      ).map((tId) => ({ id: tId }));
      // Create or update playlist to have the current track order.
      if (exists) {
        await updatePlaylist(name, {
          tracks: mergeTracks(exists.tracks, playlistTracks),
        });
      } else await createPlaylist({ name, tracks: playlistTracks });
    }),
  );

  // Import favorite media.
  await Promise.allSettled([
    // Playlists
    db
      .update(playlists)
      .set({ isFavorite: true })
      .where(inArray(playlists.name, backupContents.favorites.playlists)),
    // Albums
    db
      .update(albums)
      .set({ isFavorite: true })
      .where(
        inArray(
          albums.id,
          findExistingAlbums(backupContents.favorites.albums).map((a) => a.id),
        ),
      ),
  ]);
}
//#endregion
