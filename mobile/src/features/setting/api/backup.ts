import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { StorageAccessFramework as SAF } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { and, eq, isNull } from "drizzle-orm";
import { useSetAtom } from "jotai";
import { Platform } from "react-native";
import { Toast } from "react-native-toast-notifications";
import { z } from "zod";

import { db } from "@/db";
import type { TrackWithAlbum } from "@/db/schema";
import { albums, playlists, tracks, tracksToPlaylists } from "@/db/schema";
import { getPlaylists, getTracks } from "@/db/queries";
import { sanitizedPlaylistName } from "@/db/utils/validators";
import { getFavoriteLists } from "@/api/favorites";

// import { resynchronizeOnAtom } from "@/features/playback/api/synchronize";

import { clearAllQueries } from "@/lib/react-query";
import { pickKeys } from "@/utils/object";
import { isFulfilled } from "@/utils/promise";

const RawAlbum = z.object({
  name: z.string().trim().min(1),
  artistName: z.string().trim().min(1),
});

const RawTrack = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  artistName: z.string().trim().min(1).nullish(),
  albumName: z.string().trim().min(1).nullish(),
});

const MusicBackup = z.object({
  favorites: z.object({
    playlists: z.string().transform(sanitizedPlaylistName).array(),
    albums: RawAlbum.array(),
    tracks: RawTrack.array(),
  }),
  playlists: z
    .object({
      name: z.string().transform(sanitizedPlaylistName),
      tracks: RawTrack.array(),
    })
    .array(),
});

function extractRawTrack({ id, name, artistName, album }: TrackWithAlbum) {
  return { id, name, artistName, albumName: album?.name ?? undefined };
}

export async function exportBackup() {
  // Get favorited values.
  const favLists = await getFavoriteLists();
  const favTracks = await getTracks([eq(tracks.isFavorite, true)]);
  // Get the playlists we created to be exported.
  const playlists = await getPlaylists();

  // Temporarily create exported file in cache.
  const fileContent = JSON.stringify({
    favorites: {
      playlists: favLists.playlists.map(({ name }) => name),
      albums: favLists.albums.map((al) => pickKeys(al, ["name", "artistName"])),
      tracks: favTracks.map(extractRawTrack),
    },
    playlists: playlists.map(({ name, tracks }) => ({
      name,
      tracks: tracks.map(extractRawTrack),
    })),
  });
  const fileOpts = { encoding: FileSystem.EncodingType.UTF8 };

  const tempUri = FileSystem.cacheDirectory + "music_backup.json";
  await FileSystem.writeAsStringAsync(tempUri, fileContent, fileOpts);

  // Have user save temporary file in more accessible location.
  const UTI = "public.json";
  const mimeType = "application/json";

  if (Platform.OS === "android") {
    // Get user to select a folder inside the "Download" directory.
    const downloadDir = SAF.getUriForDirectoryInRoot("Download");
    const permissions = await SAF.requestDirectoryPermissionsAsync(downloadDir);
    if (!permissions.granted) {
      // Delete temporary file before throwing eror.
      await FileSystem.deleteAsync(tempUri);
      throw new Error("No save location selected.");
    }
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

  // Delete temporary file.
  await FileSystem.deleteAsync(tempUri);
}

export async function importBackup() {
  // Have user select a `.json` file and save it to cache.
  const { assets, canceled } = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "application/octet-stream"],
  });
  if (canceled) throw new Error("Cancelled backup import.");
  // Selected document should be a `.json` file due to the provided mimeType.
  const document = assets[0];
  if (!document) throw new Error("No backup file selected.");

  // Read, parse, and validate file contents.
  const docContents = await FileSystem.readAsStringAsync(document.uri);
  let backupContents;
  try {
    // Validate the data structure.
    backupContents = MusicBackup.parse(JSON.parse(docContents));
  } catch (err) {
    // Delete cached file before throwing a more readable error.
    await FileSystem.deleteAsync(document.uri);
    throw new Error("Invalid backup file structure.");
  }

  // Save backup contents to database.
  await Promise.allSettled(
    backupContents.playlists.map(async ({ name, tracks }) => {
      // Create playlist if it doesn't exist.
      await db.insert(playlists).values({ name }).onConflictDoNothing();

      // Get ids of tracks in this playlist.
      const plTracks = await Promise.allSettled(
        tracks.map(async (t) => {
          // Get the album id for the track if it exists.
          const al = t.albumName
            ? await db.query.albums.findFirst({
                where: (fields, { and, eq }) =>
                  and(
                    eq(fields.name, t.albumName!),
                    // Note: This won't work correctly for "collaboration" albums.
                    eq(fields.artistName, t.artistName!),
                  ),
                columns: { id: true },
              })
            : undefined;
          if (t.albumName && !al) throw new Error("Track album not found.");
          // Find track based on specifications.
          return db.query.tracks.findFirst({
            where: (fields, { and, eq, isNull }) =>
              and(
                eq(fields.name, t.name),
                t.artistName
                  ? eq(fields.artistName, t.artistName)
                  : isNull(fields.artistName),
                al ? eq(fields.albumId, al.id) : undefined,
              ),
            columns: { id: true },
          });
        }),
      );
      const foundTracks = plTracks.filter(isFulfilled).map((t) => t.value);
      const trackIds = foundTracks.filter((t) => !!t).map(({ id }) => id);

      // Create relationship between tracks & playlist.
      await Promise.allSettled(
        trackIds.map((id) =>
          db
            .insert(tracksToPlaylists)
            .values({ trackId: id, playlistName: name }),
        ),
      );
    }),
  );

  await Promise.allSettled([
    // Favorite playlists.
    ...backupContents.favorites.playlists.map((name) =>
      db
        .update(playlists)
        .set({ isFavorite: true })
        .where(eq(playlists.name, name)),
    ),
    // Favorite albums.
    ...backupContents.favorites.albums.map(({ name, artistName }) =>
      db
        .update(albums)
        .set({ isFavorite: true })
        .where(and(eq(albums.name, name), eq(albums.artistName, artistName))),
    ),
    // Favorite tracks.
    ...backupContents.favorites.tracks.map(async (t) => {
      // Get the album id for the track if it exists.
      const al = t.albumName
        ? await db.query.albums.findFirst({
            where: (fields, { and, eq }) =>
              and(
                eq(fields.name, t.albumName!),
                // Note: This won't work correctly for "collaboration" albums.
                eq(fields.artistName, t.artistName!),
              ),
            columns: { id: true },
          })
        : undefined;
      if (t.albumName && !al) throw new Error("Track album not found.");
      // Favorite track based on specifications.
      return db
        .update(tracks)
        .set({ isFavorite: true })
        .where(
          and(
            eq(tracks.name, t.name),
            t.artistName
              ? eq(tracks.artistName, t.artistName)
              : isNull(tracks.artistName),
            al ? eq(tracks.albumId, al.id) : undefined,
          ),
        );
    }),
  ]);

  // Delete the cached document.
  await FileSystem.deleteAsync(document.uri);
}

/** Create a `music_backup.json` file to be saved. */
export const useExportBackup = () =>
  useMutation({
    mutationFn: exportBackup,
    onSuccess: () => {
      Toast.show("Created backup successfully.");
    },
    onError: (err) => {
      Toast.show(err.message, { type: "danger" });
    },
  });

/** Load data from a `music_backup.json` file. */
export const useImportBackup = () => {
  const queryClient = useQueryClient();
  // const resynchronizeFn = useSetAtom(resynchronizeOnAtom);

  return useMutation({
    mutationFn: importBackup,
    onSuccess: () => {
      clearAllQueries(queryClient);
      // // Resynchronize with Jotai.
      // resynchronizeFn({ action: "update", data: null });
      Toast.show("Backup import completed.");
    },
    onError: (err) => {
      Toast.show(err.message, { type: "danger" });
    },
  });
};
