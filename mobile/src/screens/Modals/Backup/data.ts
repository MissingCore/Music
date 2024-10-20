import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { and, eq, isNull } from "drizzle-orm";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import { Toast } from "react-native-toast-notifications";
import { z } from "zod";

import { db } from "@/db";
import type { TrackWithAlbum } from "@/db/schema";
import { albums, playlists, tracks, tracksToPlaylists } from "@/db/schema";
import {
  getAlbum,
  getAlbums,
  getPlaylists,
  getTrack,
  getTracks,
} from "@/db/queries";
import { sanitizedPlaylistName } from "@/db/utils/validators";

import i18next from "@/modules/i18n";
import { Resynchronize, musicStore } from "@/modules/media/services/Music";

import { clearAllQueries } from "@/lib/react-query";
import { pickKeys } from "@/utils/object";
import { isFulfilled } from "@/utils/promise";
import type { Maybe } from "@/utils/types";

const SAF = FileSystem.StorageAccessFramework;

//#region Schemas
const RawAlbum = z.object({
  name: z.string().trim().min(1),
  artistName: z.string().trim().min(1),
});

const RawTrack = z.object({
  /** @deprecated Not used due to the file id changing per device. */
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  artistName: z.string().trim().min(1).nullish(),
  albumName: z.string().trim().min(1).nullish(),
});

const MusicBackup = z.object({
  favorites: z.object({
    albums: RawAlbum.array(),
    playlists: z.string().transform(sanitizedPlaylistName).array(),
    tracks: RawTrack.array(),
  }),
  playlists: z
    .object({
      name: z.string().transform(sanitizedPlaylistName),
      tracks: RawTrack.array(),
    })
    .array(),
});
//#endregion

//#region Helpers
/**
 * Returns the id of the album from the specified parameters. Throws error
 * if no album found with specified parameters.
 *
 * Doesn't work correctly for "collaboration" albums.
 */
async function getAlbumId<T extends Maybe<string>>(
  albumName: T,
  artistName: T,
) {
  if (!albumName || !artistName) return undefined;
  return (
    await getAlbum([
      eq(albums.name, albumName),
      eq(albums.artistName, artistName),
    ])
  ).id;
}

function getRawTrack({ id, name, artistName, album }: TrackWithAlbum) {
  return { id, name, artistName, albumName: album?.name };
}
//#endregion

//#region Export
async function exportBackup() {
  // Get favorited values.
  const [favAlbums, favPlaylists, favTracks] = await Promise.all([
    getAlbums([eq(albums.isFavorite, true)]),
    getPlaylists([eq(playlists.isFavorite, true)]),
    getTracks([eq(tracks.isFavorite, true)]),
  ]);
  // Get all user-generated playlists.
  const allPlaylists = await getPlaylists();

  // Organize exported file contents.
  const mimeType = "application/json";
  const fileOpts = { encoding: FileSystem.EncodingType.UTF8 };
  const fileContent = JSON.stringify({
    favorites: {
      playlists: favPlaylists.map(({ name }) => name),
      albums: favAlbums.map((al) => pickKeys(al, ["name", "artistName"])),
      tracks: favTracks.map(getRawTrack),
    },
    playlists: allPlaylists.map(({ name, tracks }) => {
      return { name, tracks: tracks.map(getRawTrack) };
    }),
  });

  // User selects accessible location to save this backup file.
  if (Platform.OS === "android") {
    // Get user to select a folder inside the "Download" directory.
    const downloadDir = SAF.getUriForDirectoryInRoot("Download");
    const perms = await SAF.requestDirectoryPermissionsAsync(downloadDir);
    if (!perms.granted) throw new Error(i18next.t("response.actionCancel"));

    // Create a new file in specified directory & write contents.
    const fileUri = await SAF.createFileAsync(
      ...[perms.directoryUri, "music_backup", mimeType],
    );
    await SAF.writeAsStringAsync(fileUri, fileContent, fileOpts);
  } else if (Platform.OS === "ios") {
    // Temporarily create exported file in cache.
    const tempUri = FileSystem.cacheDirectory + "music_backup.json";
    await FileSystem.writeAsStringAsync(tempUri, fileContent, fileOpts);
    // On iOS, there's a "Save to Files" option in the sharing menu.
    await Sharing.shareAsync(tempUri, { UTI: "public.json", mimeType });
    // Delete temporary file.
    await FileSystem.deleteAsync(tempUri);
  }
}
//#endregion

//#region Import
async function importBackup() {
  // Select the `music_backup.json` file we'll be importing from.
  const { assets, canceled } = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "application/octet-stream"],
  });
  if (canceled) throw new Error(i18next.t("response.actionCancel"));
  const document = assets[0];
  if (!document) throw new Error(i18next.t("response.noSelect"));

  // Read, parse, and validate file contents.
  const docContents = await FileSystem.readAsStringAsync(document.uri);
  let backupContents;
  try {
    // Validate the data structure.
    backupContents = MusicBackup.parse(JSON.parse(docContents));
  } catch (err) {
    // Delete cached file before throwing a more readable error.
    await FileSystem.deleteAsync(document.uri);
    throw new Error(i18next.t("response.invalidStructure"));
  }

  // Import playlists.
  await Promise.allSettled(
    backupContents.playlists.map(async ({ name, tracks: plTracks }) => {
      // Create playlist if it doesn't exist.
      await db.insert(playlists).values({ name }).onConflictDoNothing();

      // Get all the ids of the tracks in this playlist.
      const _trackIds = await Promise.allSettled(
        plTracks.map(async (t) => {
          const albumId = await getAlbumId(t.albumName, t.artistName);
          const track = await getTrack([
            eq(tracks.name, t.name),
            t.artistName
              ? eq(tracks.artistName, t.artistName)
              : isNull(tracks.artistName),
            albumId ? eq(tracks.albumId, albumId) : undefined,
          ]);
          return track.id;
        }),
      );
      const trackIds = _trackIds.filter(isFulfilled).map((t) => t.value);

      // Create relations between tracks & playlist.
      await Promise.allSettled(
        trackIds.map((trackId) =>
          db.insert(tracksToPlaylists).values({ trackId, playlistName: name }),
        ),
      );
    }),
  );

  // Import favorite media.
  await Promise.allSettled([
    // Playlists
    ...backupContents.favorites.playlists.map((name) =>
      db
        .update(playlists)
        .set({ isFavorite: true })
        .where(eq(playlists.name, name)),
    ),
    // Albums
    ...backupContents.favorites.albums.map(({ name, artistName }) =>
      db
        .update(albums)
        .set({ isFavorite: true })
        .where(and(eq(albums.name, name), eq(albums.artistName, artistName))),
    ),
    // Tracks
    ...backupContents.favorites.tracks.map(async (t) => {
      const albumId = await getAlbumId(t.albumName, t.artistName);
      return db
        .update(tracks)
        .set({ isFavorite: true })
        .where(
          and(
            eq(tracks.name, t.name),
            t.artistName
              ? eq(tracks.artistName, t.artistName)
              : isNull(tracks.artistName),
            albumId ? eq(tracks.albumId, albumId) : undefined,
          ),
        );
    }),
  ]);

  // Delete the cached document.
  await FileSystem.deleteAsync(document.uri);

  const currPlayingFrom = musicStore.getState().playingSource;
  if (currPlayingFrom) await Resynchronize.onTracks(currPlayingFrom);
}
//#endregion

//#region Mutation Hooks
export const useExportBackup = () => {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: exportBackup,
    onSuccess: () => {
      Toast.show(t("response.exportSuccess"));
    },
    onError: (err) => {
      Toast.show(err.message, { type: "danger" });
    },
  });
};

export const useImportBackup = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importBackup,
    onSuccess: () => {
      clearAllQueries({ client: queryClient });
      Toast.show(t("response.importSuccess"));
    },
    onError: (err) => {
      Toast.show(err.message, { type: "danger" });
    },
  });
};
//#endregion
