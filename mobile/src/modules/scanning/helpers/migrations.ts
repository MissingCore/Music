import OldAsyncStorage from "@react-native-async-storage/async-storage";
import { eq, inArray } from "drizzle-orm";
import AsyncStorage from "expo-sqlite/kv-store";

import { db } from "~/db";
import type { AlbumWithTracks } from "~/db/schema";
import { albums, fileNodes, tracks } from "~/db/schema";

import { getAlbums } from "~/api/album";
import { musicStore } from "~/modules/media/services/Music";
import { recentListStore } from "~/modules/media/services/RecentList";
import { sortPreferencesStore } from "~/modules/media/services/SortPreferences";
import { userPreferencesStore } from "~/services/UserPreferences";
import { onboardingStore } from "../services/Onboarding";

import { removeUnusedCategories } from "./audio";
import { savePathComponents } from "./folder";
import type { MigrationOption } from "../constants";
import { MigrationHistory } from "../constants";

/**
 * Run code to change some values prior to indexing for any changes
 * between updates that would require it.
 */
export async function checkForMigrations() {
  const value = await AsyncStorage.getItem("last-adjustment");
  const lastMigrationCode = value !== null ? Number(value) : -1;

  // Exit early if we don't need to do any migrations.
  const lastestMigrationCode = Object.keys(MigrationHistory).length - 1;
  if (lastMigrationCode === lastestMigrationCode) return;

  // Set the current phase to `preprocess` as we have to run some migrations.
  onboardingStore.setState({ phase: "preprocess" });

  // Get the list of migrations we need to make.
  const pendingMigrations: MigrationOption[] = [];
  for (let i = lastMigrationCode; i < lastestMigrationCode; i++) {
    pendingMigrations.push(...(MigrationHistory[i + 1]?.changes ?? []));
  }

  // Apply migrations.
  for (const migration of pendingMigrations) {
    await MigrationFunctionMap[migration]();
  }

  // Make sure we don't do this logic all over again.
  await AsyncStorage.setItem("last-adjustment", `${lastestMigrationCode}`);
}

/** Logic we want to run depending on what migrations we need to do. */
const MigrationFunctionMap: Record<MigrationOption, () => Promise<void>> = {
  "kv-store": async () => {
    const allKeys = await OldAsyncStorage.getAllKeys();
    if (allKeys.length === 0) return;
    await AsyncStorage.clear();
    // @ts-expect-error - Should be able to pass the data without problems.
    await AsyncStorage.multiSet(await OldAsyncStorage.multiGet(allKeys));

    // We need to rehydrate the stores that references the data in AsyncStorage
    // in order for it to take effect.
    //  - Note: We need to rehydrate the "Recent List" store first as when
    //  the "User Preference" store hydrates, it calls `RecentList.refresh()`,
    //  which will clear the migrated "Recent List" store data as it hasn't
    //  hydrated in yet.
    await recentListStore.persist.rehydrate();
    await sortPreferencesStore.persist.rehydrate();
    await userPreferencesStore.persist.rehydrate();
    await musicStore.persist.rehydrate();

    // Delete data in the old AsyncStorage provider afterwards.
    await OldAsyncStorage.clear();
  },

  "fileNodes-adjustment": async () => {
    const oldRootNodes = await db.query.fileNodes.findMany({
      where: (fields, { isNull }) => isNull(fields.parentPath),
    });
    // Delete these old "shortcut"s.
    await db.delete(fileNodes).where(
      inArray(
        fileNodes.path,
        oldRootNodes.map((node) => node.path),
      ),
    );
    await Promise.allSettled(
      // The "placeholder" portion won't get saved.
      oldRootNodes.map((node) =>
        savePathComponents("file:///" + node.path + "placeholder"),
      ),
    );
  },

  "duplicate-album-fix": async () => {
    /* 1. Copy `releaseYear` to `year` field. */
    const allAlbums = await getAlbums();
    await Promise.allSettled(
      allAlbums.map(({ id, releaseYear }) => {
        if (!releaseYear || releaseYear === -1) return;
        return db
          .update(tracks)
          .set({ year: releaseYear })
          .where(eq(tracks.albumId, id));
      }),
    );

    //* 2. Remove duplicate album entries. */
    // Get mapping of albums that have the same album names.
    const duplicateAlbumNameMap = Object.values(
      allAlbums.reduce<Record<string, AlbumWithTracks[]>>((accum, album) => {
        if (accum[album.name]) accum[album.name]!.push(album);
        else accum[album.name] = [album];
        return accum;
      }, {}),
    ).filter((sameNameAlbums) => sameNameAlbums.length > 1);

    // Figure out which albums are actual duplicates.
    for (const sameNameAlbums of Object.values(duplicateAlbumNameMap)) {
      // Record of: "Album Artist" + "Album Id"[]
      const albumInfoMap: Record<string, string[]> = {};
      for (const { id, artistName } of sameNameAlbums) {
        if (albumInfoMap[artistName]) albumInfoMap[artistName].push(id);
        else albumInfoMap[artistName] = [id];
      }

      // Have tracks use the same `albumId` if we have duplicate
      // "Album Artist" + "Album Name" combinations.
      await Promise.allSettled(
        Object.values(albumInfoMap).map((ids) => {
          if (ids.length === 1) return;
          return db
            .update(tracks)
            .set({ albumId: ids[0]! })
            .where(inArray(tracks.albumId, ids));
        }),
      );
    }

    // Remove albums that we remapped.
    await removeUnusedCategories();

    /* 3. Set `releaseYear = -1` to preserve unique key behavior. */
    // eslint-disable-next-line drizzle/enforce-update-with-where
    await db.update(albums).set({ releaseYear: -1 });
  },
};
