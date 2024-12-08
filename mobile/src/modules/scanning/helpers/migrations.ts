import AsyncStorage from "@react-native-async-storage/async-storage";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { tracks } from "@/db/schema";

import { userPreferencesStore } from "@/services/UserPreferences";

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

  // Get the list of migrations we need to make.
  let pendingMigrations: MigrationOption[] = [];
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
  "v1-to-v2-store": async () => {
    // Fetch any configs stored in the old AsyncStorage keys.
    const listAllow = await readFilterList("directory-allowlist");
    const listBlock = await readFilterList("directory-blocklist");

    userPreferencesStore.setState({ listAllow, listBlock });
  },
  "v1-to-v2-schema": async () => {
    // We now allow the `track` field to be null.
    await db.update(tracks).set({ track: null }).where(eq(tracks.track, -1));
    // Easy way of rechecking all tracks.
    // eslint-disable-next-line drizzle/enforce-update-with-where
    await db.update(tracks).set({ modificationTime: -1 });
  },
};

/** Helper to get the `string[]` stored in the allow or block list. */
async function readFilterList(key: `directory-${"allowlist" | "blocklist"}`) {
  const _list = await AsyncStorage.getItem(key);
  const list: string[] = _list !== null ? JSON.parse(_list) : [];
  return Array.isArray(list) ? list : [];
}
