import type { SQLiteDatabase } from "expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { useEffect } from "react";

import { useIndexAudio } from "@/features/indexing/hooks/useIndexAudio";
import { useSetupTrackPlayer } from "./useSetupTrackPlayer";

import { db, expoSQLiteDB } from "@/db";
import migrations from "@/db/drizzle/migrations";

/**
 * Makes splash screen visible until all initialization tasks are
 * complete.
 */
export function useLoadResources() {
  const { success: dbSuccess, error: dbError } = useMigrations(db, migrations);
  useDevOnly(expoSQLiteDB);
  const tracksSaved = useIndexAudio();
  useSetupTrackPlayer();

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (dbError) throw dbError;
  }, [dbError]);

  return { isLoaded: dbSuccess && tracksSaved };
}

/** Only run Expo dev tools plugins during development. */
function useDevOnly(db: SQLiteDatabase | null) {
  const hook = __DEV__ ? useDrizzleStudio : () => {};
  return hook(db);
}
