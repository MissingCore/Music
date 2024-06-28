import { useMutation } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";
import { StorageAccessFramework as SAF } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { eq } from "drizzle-orm";
import { Platform } from "react-native";

import type { TrackWithAlbum } from "@/db/schema";
import { tracks } from "@/db/schema";
import { getPlaylists, getTracks } from "@/db/queries";
import { getFavoriteLists } from "@/api/favorites";

import { pickKeys } from "@/utils/object";
import type { Prettify } from "@/utils/types";

type RawAlbum = { name: string; artistName: string };
type RawTrack = Prettify<RawAlbum & { id: string; albumName?: string }>;

type MusicBackup = {
  favorites: { playlists: string[]; albums: RawAlbum[]; tracks: RawTrack[] };
  playlists: Array<{ name: string; tracks: RawTrack[] }>;
};

function extractRawTrack({ id, name, artistName, album }: TrackWithAlbum) {
  return {
    ...{ id, name, artistName },
    albumName: album ? album.name : undefined,
  };
}

export async function exportBackup() {
  // Get favorited values.
  const favLists = await getFavoriteLists();
  const favTracks = await getTracks([eq(tracks.isFavorite, true)]);
  // Get the playlists we created to be exported.
  const playlists = await getPlaylists();

  const backup: MusicBackup = {
    favorites: {
      playlists: favLists.playlists.map(({ name }) => name),
      albums: favLists.albums.map((al) => pickKeys(al, ["name", "artistName"])),
      tracks: favTracks.map(extractRawTrack),
    },
    playlists: playlists.map(({ name, tracks }) => ({
      name,
      tracks: tracks.map(extractRawTrack),
    })),
  };

  // Temporarily create exported file in cache.
  const fileContent = JSON.stringify(backup);
  const fileOpts = { encoding: FileSystem.EncodingType.UTF8 };

  const tempUri = FileSystem.cacheDirectory + "music_backup.json";
  await FileSystem.writeAsStringAsync(tempUri, fileContent, fileOpts);

  // Have user save temporary file in more accessible location.
  const UTI = "public.json";
  const mimeType = "application/json";

  downloadBlock: {
    if (Platform.OS === "android") {
      // Get user to select a folder inside the "Download" directory.
      const downloadDir = SAF.getUriForDirectoryInRoot("Download");
      const permissions =
        await SAF.requestDirectoryPermissionsAsync(downloadDir);
      if (!permissions.granted) break downloadBlock;
      // Create a new file in specified directory. `SAF.copyAsync()` currently
      // throws an error, saying the location isn't writable.
      const fileUri = await SAF.createFileAsync(
        ...[permissions.directoryUri, "music_backup", mimeType],
      );
      await SAF.writeAsStringAsync(fileUri, fileContent, fileOpts);
    } else if (Platform.OS === "ios") {
      // On iOS, there's a "Save to Files" option.
      await Sharing.shareAsync(tempUri, { UTI, mimeType });
    }
  }

  // Delete temporary file.
  await FileSystem.deleteAsync(tempUri);
}

/** @description Create a `music_backup.json` file to be saved. */
export const useExportBackup = () => useMutation({ mutationFn: exportBackup });
