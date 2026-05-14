import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import type { SQLiteDatabase } from "expo-sqlite";
import { useEffect, useState } from "react";

import { db, expoSQLiteDB } from "~/db";
import migrations from "~/db/drizzle/migrations";

import { useSetup } from "./useSetup";
import { checkForMigrations } from "../helpers/migrations";

import { createImageDirectory } from "~/lib/file-system";
import { Stopwatch } from "~/utils/debug";
import { createFontDirectory } from "~/modules/customization/font/core/data";

/** Logic that should be run before rendering the onboarding/scanning progress views. */
export function useLoadResources() {
  const { success: dbSuccess, error: dbError } = useMigrations(db, migrations);
  useDevOnly(expoSQLiteDB);
  const setupCompleted = useSetup();
  const [migrationCompleted, setMigrationCompleted] = useState(false);
  const [migrationError, setMigrationError] = useState<Error>();

  useEffect(() => {
    // Make sure the Zustand store is hydrated before we do anything.
    if (!setupCompleted) return;

    (async function () {
      try {
        const stopwatch = new Stopwatch();

        await createImageDirectory();
        createFontDirectory();

        // Fix database entries if we make any "breaking" changes.
        await checkForMigrations();
        console.log(`Completed migrations in ${stopwatch.lapTime()}.`);

        setMigrationCompleted(true);
      } catch (err) {
        setMigrationError(err as Error);
      }
    })();
  }, [setupCompleted]);

  return {
    isLoaded: dbSuccess && migrationCompleted,
    error: dbError ?? migrationError,
  };
}

/** Only run Expo dev tools plugins during development. */
function useDevOnly(db: SQLiteDatabase | null) {
  const hook = __DEV__ ? useDrizzleStudio : () => {};
  return hook(db);
}
