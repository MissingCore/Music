import { useEffect } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";

import { db } from "@/db";
import migrations from "@/drizzle/migrations";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export function useLoadAssets() {
  const [fontsLoaded, fontsError] = useFonts({
    GeistMonoLight: require("../assets/fonts/GeistMono-Light.ttf"),
    GeistMono: require("../assets/fonts/GeistMono-Regular.ttf"),
    GeistMonoMedium: require("../assets/fonts/GeistMono-Medium.ttf"),
    Ndot57: require("../assets/fonts/Ndot-57.ttf"),
  });
  const { success: dbSuccess, error: dbError } = useMigrations(db, migrations);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (fontsError) throw fontsError;
    if (dbError) throw dbError;
  }, [fontsError, dbError]);

  useEffect(() => {
    if (fontsLoaded && dbSuccess) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded && dbSuccess]);

  return { isLoaded: fontsLoaded && dbSuccess };
}
