import { toast } from "@missingcore/toast";
import { useMutation } from "@tanstack/react-query";
import { getDocumentAsync } from "expo-document-picker";
import { File } from "expo-file-system";
import { eq, inArray } from "drizzle-orm";
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

import { pickDirectory } from "~/lib/file-system";
import { clearAllQueries } from "~/lib/react-query";
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

//#region Export
/**
 * @deprecated We plan on updating the backup schema, so this old export
 * code will be replaced while the old import code will stay for a while.
 */
async function exportBackup() {
  // Get favorited values.
  const [favAlbums, favPlaylists] = await Promise.all([
    getAlbumsSummary(false, [eq(albums.isFavorite, true)]),
    getPlaylistsSummary(false, [eq(playlists.isFavorite, true)]),
  ]);
  // Get all user-generated playlists.
  const allPlaylists = await getPlaylistsSummary(true);

  // User selects location to save this backup file.
  const dir = await pickDirectory();

  // Create a new file in specified directory & write contents.
  const backupFile = dir.createFile("music_backup", "application/json");
  backupFile.write(
    JSON.stringify({
      favorites: {
        playlists: favPlaylists.map(({ id }) => id),
        albums: favAlbums.map(({ name, artistsKey }) => {
          return { name, artistName: artistsKey };
        }),
        //! [Deprecated] For backwards compatibility.
        tracks: [],
      },
      playlists: allPlaylists.map(({ id, tracks }) => ({
        name: id,
        tracks: tracks.map((t) => ({
          name: t.name,
          artistName: t.rawArtistName,
          albumName: t.albumName,
        })),
      })),
    }),
  );
}
//#endregion

//#region Import
async function importBackup() {
  // Select the `music_backup.json` file we'll be importing from.
  const { assets, canceled } = await getDocumentAsync({
    type: ["application/json", "application/octet-stream"],
  });
  if (canceled) throw new Error(i18next.t("err.msg.actionCancel"));
  if (!assets[0]) throw new Error(i18next.t("err.msg.noSelect"));
  const documentFile = new File(assets[0].uri);

  // Read, parse, and validate file contents.
  const docContents = await documentFile.text();
  let backupContents;
  try {
    // Validate the data structure.
    backupContents = MusicBackup.parse(JSON.parse(docContents));
  } catch {
    // Delete cached file before throwing a more readable error.
    documentFile.delete();
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
      const playlistTracks = findExistingTracks(plTracks);
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

  // Delete the cached document.
  documentFile.delete();
}
//#endregion

//#region Mutation Hooks
export const useExportBackup = () => {
  return useMutation({
    mutationFn: exportBackup,
    onSuccess: () => {
      toast.t("feat.backup.extra.exportSuccess");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
};

export const useImportBackup = () => {
  return useMutation({
    mutationFn: importBackup,
    onSuccess: () => {
      clearAllQueries();
      toast.t("feat.backup.extra.importSuccess");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
};
//#endregion
