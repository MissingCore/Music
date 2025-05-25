import OldAsyncStorage from "@react-native-async-storage/async-storage";
import AsyncStorage from "expo-sqlite/kv-store";

import { musicStore } from "~/modules/media/services/Music";
import { recentListStore } from "~/modules/media/services/RecentList";
import { sortPreferencesStore } from "~/modules/media/services/SortPreferences";
import { userPreferencesStore } from "~/services/UserPreferences";
import { onboardingStore } from "../services/Onboarding";

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
export const MigrationFunctionMap: Record<
  MigrationOption,
  () => Promise<void>
> = {
  "kv-store": async () => {
    const allKeys = await OldAsyncStorage.getAllKeys();
    if (allKeys.length === 0) return;
    await AsyncStorage.clear();
    // @ts-expect-error - Should be able to pass the data without problems.
    await AsyncStorage.multiSet(await OldAsyncStorage.multiGet(allKeys));

    // We need to rehydrate the stores that references the data in AsyncStorage
    // in order for it to take effect.
    await userPreferencesStore.persist.rehydrate();
    await musicStore.persist.rehydrate();
    await recentListStore.persist.rehydrate();
    await sortPreferencesStore.persist.rehydrate();

    // Delete data in the old AsyncStorage provider afterwards.
    await OldAsyncStorage.clear();
  },
};
