import { toast } from "@backpackapp-io/react-native-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { eq, inArray } from "drizzle-orm";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { db } from "~/db";
import type { TrackWithAlbum } from "~/db/schema";
import { albums, playlists, tracks } from "~/db/schema";
import { mergeTracks, sanitizePlaylistName } from "~/db/utils";

import i18next from "~/modules/i18n";
import { getAlbums } from "~/api/album";
import { createPlaylist, getPlaylists, updatePlaylist } from "~/api/playlist";
import { getTracks } from "~/api/track";
import { musicStore } from "~/modules/media/services/Music";
import { RecentList } from "~/modules/media/services/RecentList";
import { Resynchronize } from "~/modules/media/services/Resynchronize";

import { clearAllQueries } from "~/lib/react-query";
import { ToastOptions } from "~/lib/toast";
import { pickKeys } from "~/utils/object";

const SAF = FileSystem.StorageAccessFramework;

//#region Schemas
const RawAlbum = z.object({
  name: z.string().trim().min(1),
  artistName: z.string().trim().min(1),
});

const RawTrack = z.object({
  name: z.string().trim().min(1),
  artistName: z.string().trim().min(1).nullish(),
  albumName: z.string().trim().min(1).nullish(),
});

const MusicBackup = z.object({
  favorites: z.object({
    albums: RawAlbum.array(),
    playlists: z.string().transform(sanitizePlaylistName).array(),
    tracks: RawTrack.array(),
  }),
  playlists: z
    .object({
      name: z.string().transform(sanitizePlaylistName),
      tracks: RawTrack.array(),
    })
    .array(),
});
//#endregion

//#region Helpers
function getRawTrack({ name, artistName, album }: TrackWithAlbum) {
  return { name, artistName, albumName: album?.name };
}

/** Creates a factory function that finds albums associated to `RawAlbum`. */
async function findExistingAlbumsFactory() {
  const allAlbums = await getAlbums();
  return (entries: Array<z.infer<typeof RawAlbum>>) => {
    return entries
      .map((entry) =>
        allAlbums.find(
          (t) => t.name === entry.name && t.artistName === entry.artistName,
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
            t.artistName === entry.artistName &&
            t.album?.name === entry.albumName,
        ),
      )
      .filter((entry) => entry !== undefined);
  };
}
//#endregion

//#region Export
async function exportBackup() {
  // Get favorited values.
  const [favAlbums, favPlaylists, favTracks] = await Promise.all([
    getAlbums({ where: [eq(albums.isFavorite, true)] }),
    getPlaylists({ where: [eq(playlists.isFavorite, true)] }),
    getTracks({ where: [eq(tracks.isFavorite, true)] }),
  ]);
  // Get all user-generated playlists.
  const allPlaylists = await getPlaylists();

  // User selects accessible location inside the "Download" directory to
  // save this backup file.
  const downloadDir = SAF.getUriForDirectoryInRoot("Download");
  const perms = await SAF.requestDirectoryPermissionsAsync(downloadDir);
  if (!perms.granted) throw new Error(i18next.t("response.actionCancel"));

  // Create a new file in specified directory & write contents.
  const fileUri = await SAF.createFileAsync(
    ...[perms.directoryUri, "music_backup", "application/json"],
  );
  await SAF.writeAsStringAsync(
    fileUri,
    JSON.stringify({
      favorites: {
        playlists: favPlaylists.map(({ name }) => name),
        albums: favAlbums.map((al) => pickKeys(al, ["name", "artistName"])),
        tracks: favTracks.map(getRawTrack),
      },
      playlists: allPlaylists.map(({ name, tracks }) => {
        return { name, tracks: tracks.map(getRawTrack) };
      }),
    }),
    { encoding: FileSystem.EncodingType.UTF8 },
  );
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

  const allPlaylists = await getPlaylists();

  const findExistingAlbums = await findExistingAlbumsFactory();
  const findExistingTracks = await findExistingTracksFactory();

  // Import playlists.
  await Promise.allSettled(
    backupContents.playlists.map(async ({ name, tracks: plTracks }) => {
      const exists = allPlaylists.find((pl) => pl.name === name);
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
    // Tracks
    db
      .update(tracks)
      .set({ isFavorite: true })
      .where(
        inArray(
          tracks.id,
          findExistingTracks(backupContents.favorites.tracks).map((t) => t.id),
        ),
      ),
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
      RecentList.refresh();
      toast(t("response.exportSuccess"), ToastOptions);
    },
    onError: (err) => {
      toast.error(err.message, ToastOptions);
    },
  });
};

export const useImportBackup = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importBackup,
    onSuccess: () => {
      clearAllQueries(queryClient);
      toast(t("response.importSuccess"), ToastOptions);
    },
    onError: (err) => {
      toast.error(err.message, ToastOptions);
    },
  });
};
//#endregion
