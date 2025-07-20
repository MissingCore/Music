import { toast } from "@backpackapp-io/react-native-toast";
import { useMutation } from "@tanstack/react-query";
import { getDocumentAsync } from "expo-document-picker";
import { EncodingType, StorageAccessFramework as SAF } from "expo-file-system";
import { File } from "expo-file-system/next";
import { eq, inArray } from "drizzle-orm";
import { useTranslation } from "react-i18next";
import { z } from "zod/mini";

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

//#region Schemas
const NonEmptyStringSchema = z.string().check(z.trim(), z.minLength(1));
const NullableNonEmptyStringSchema = z.nullish(NonEmptyStringSchema);
const PlaylistNameSchema = z.pipe(
  z.string(),
  z.transform(sanitizePlaylistName),
);

const RawAlbum = z.object({
  name: NonEmptyStringSchema,
  artistName: NonEmptyStringSchema,
});

const RawTrack = z.object({
  name: NonEmptyStringSchema,
  artistName: NullableNonEmptyStringSchema,
  albumName: NullableNonEmptyStringSchema,
});

const MusicBackup = z.object({
  favorites: z.object({
    albums: z.array(RawAlbum),
    playlists: z.array(PlaylistNameSchema),
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
  const allTracks = await getTracks({ withHidden: true });
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
  if (!perms.granted) throw new Error(i18next.t("err.msg.actionCancel"));

  // Create a new file in specified directory & write contents.
  const fileUri = await SAF.createFileAsync(
    perms.directoryUri,
    "music_backup",
    "application/json",
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
    { encoding: EncodingType.UTF8 },
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
  const docContents = documentFile.text();
  let backupContents;
  try {
    // Validate the data structure.
    backupContents = MusicBackup.parse(JSON.parse(docContents));
  } catch {
    // Delete cached file before throwing a more readable error.
    documentFile.delete();
    throw new Error(i18next.t("err.msg.invalidStructure"));
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
  documentFile.delete();

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
      toast(t("feat.backup.extra.exportSuccess"), ToastOptions);
    },
    onError: (err) => {
      toast.error(err.message, ToastOptions);
    },
  });
};

export const useImportBackup = () => {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: importBackup,
    onSuccess: () => {
      clearAllQueries();
      toast(t("feat.backup.extra.importSuccess"), ToastOptions);
    },
    onError: (err) => {
      toast.error(err.message, ToastOptions);
    },
  });
};
//#endregion
