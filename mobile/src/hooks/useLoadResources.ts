import type { SQLiteDatabase } from "expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";

import { useIndexAudio } from "@/features/indexing/hooks/useIndexAudio";

import { db, expoSQLiteDB } from "@/db";
import migrations from "@/db/drizzle/migrations";

/**
 * Makes splash screen visible until all initialization tasks are
 * complete.
 */
export function useLoadResources() {
  const { success: dbSuccess, error: dbError } = useMigrations(db, migrations);
  useDevOnly(expoSQLiteDB);
  const { success: tracksSaved, error: tracksSaveError } = useIndexAudio();

  return {
    isLoaded: dbSuccess && tracksSaved,
    // Expo Router's Error Boundaries doesn't seem to catch these errors.
    error: dbError ?? tracksSaveError,
  };
}

/** Only run Expo dev tools plugins during development. */
function useDevOnly(db: SQLiteDatabase | null) {
  const hook = __DEV__ ? useDrizzleStudio : () => {};
  return hook(db);
}
