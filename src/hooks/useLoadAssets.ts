import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { SQLiteDatabase } from "expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useMemo } from "react";

import { useSaveAudio } from "./useSaveAudio";
import { useSetupTrackPlayer } from "./useSetupTrackPlayer";

import { db, expoSQLiteDB } from "@/db";
import migrations from "@/db/drizzle/migrations";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

/**
 * @description Makes splash screen visible until all initialization
 *  tasks are complete.
 */
export function useLoadAssets() {
  const [fontsLoaded, fontsError] = useFonts({
    GeistLight: require("../assets/fonts/Geist-Light.ttf"),
    GeistMonoLight: require("../assets/fonts/GeistMono-Light.ttf"),
    GeistMono: require("../assets/fonts/GeistMono-Regular.ttf"),
    Ndot57: require("../assets/fonts/Ndot-57.ttf"),
    ...Ionicons.font,
    ...MaterialIcons.font,
  });
  const { success: dbSuccess, error: dbError } = useMigrations(db, migrations);
  useDevOnly(expoSQLiteDB);
  const tracksSaved = useSaveAudio();
  const trackPlayerLoaded = useSetupTrackPlayer();

  const completedTasks = useMemo(() => {
    return fontsLoaded && dbSuccess && tracksSaved && trackPlayerLoaded;
  }, [fontsLoaded, dbSuccess, tracksSaved, trackPlayerLoaded]);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (fontsError) throw fontsError;
    if (dbError) throw dbError;
  }, [fontsError, dbError]);

  useEffect(() => {
    if (completedTasks) SplashScreen.hideAsync();
  }, [completedTasks]);

  return { isLoaded: completedTasks };
}

/** @description Only run Expo dev tools plugins during development. */
function useDevOnly(db: SQLiteDatabase | null) {
  const hook = __DEV__ ? useDrizzleStudio : () => {};
  return hook(db);
}
