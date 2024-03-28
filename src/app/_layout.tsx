import { useEffect } from "react";
import { Pressable } from "react-native";
import { ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Link, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";

import Colors from "@/constants/Colors";
import NavigationTheme from "@/constants/Theme";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/settings` keeps a back button present.
  initialRouteName: "(home)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    GeistMonoLight: require("../assets/fonts/GeistMono-Light.ttf"),
    GeistMono: require("../assets/fonts/GeistMono-Regular.ttf"),
    GeistMonoMedium: require("../assets/fonts/GeistMono-Medium.ttf"),
    Ndot57: require("../assets/fonts/Ndot-57.ttf"),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <ThemeProvider value={NavigationTheme}>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen
          name="(home)"
          options={{
            title: "MUSIC",
            headerTitleStyle: { fontFamily: "Ndot57", fontSize: 32 },
            headerRight: () => (
              <Link href="/setting" asChild>
                <Pressable>
                  {({ pressed }) => (
                    <Ionicons
                      name="settings-outline"
                      size={24}
                      color={Colors.foreground}
                      style={{ opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </Link>
            ),
          }}
        />
        <Stack.Screen name="(overlay)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
