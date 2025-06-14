import { Stack } from "expo-router";
import { View } from "react-native";
import Bootsplash from "react-native-bootsplash";
import TrackPlayer from "@weights-ai/react-native-track-player";

import { useLoadResources } from "~/hooks/useLoadResources";
import { AppProvider } from "~/providers";
import { ErrorBoundary } from "~/screens/ErrorBoundary";
import { OnboardingScreen } from "~/screens/Onboarding";
import { TrackSheet } from "~/screens/Sheets/Track";

import "~/resources/global.css";
import "~/modules/i18n"; // Make sure translations are bundled.
import { SENTRY_ENABLED, Sentry } from "~/lib/sentry";
import { TopAppBar } from "~/components/TopAppBar";
import { NowPlayingTopAppBar } from "~/screens/NowPlaying/TopAppBar";

// Catch any errors thrown by the Layout component.
export { ErrorBoundary };

export const unstable_settings = {
  // Ensure that reloading on `/settings` keeps a back button present.
  initialRouteName: "(main)/(home)",
};

if (SENTRY_ENABLED) {
  Sentry.init({
    dsn: "https://bbd726405356cdfb20b85f5f924fd3e3@o4507687432617984.ingest.us.sentry.io/4507687447101440",
    ignoreErrors: [
      /Missing .* permissions/,
      // Expo development errors:
      "Unable to activate keep awake",
    ],
  });
}

export default function RootLayout() {
  const { isLoaded, error } = useLoadResources();

  if (error) {
    return (
      <>
        <View ref={handleAppLifeCycle} />
        <ErrorBoundary error={error} retry={() => Promise.resolve()} />
      </>
    );
  } else if (!isLoaded) {
    return (
      <AppProvider systemTheme>
        <OnboardingScreen />
      </AppProvider>
    );
  }

  return (
    <>
      <View ref={handleAppLifeCycle} />
      <AppProvider>
        <Stack screenOptions={{ header: TopAppBar, headerShown: false }}>
          <Stack.Screen name="(main)" />
          <Stack.Screen
            name="now-playing"
            options={{
              animation: "slide_from_bottom",
              header: NowPlayingTopAppBar,
              headerTransparent: true,
              headerShown: true,
              headerTitle: "",
            }}
          />
          <Stack.Screen
            name="search"
            options={{ headerShown: true, title: "" }}
          />
          <Stack.Screen name="setting" />
          <Stack.Screen name="notification.click" />
        </Stack>

        <TrackSheet />
      </AppProvider>
    </>
  );
}

function handleAppLifeCycle() {
  // Encountered issue in Android 12+ where one of the bootsplashes
  // persisted when it shouldn't. Make sure we close at least the bootsplash
  // from `react-native-bootsplash` whenever we render the app (in case its
  // "autohide" behavior doesn't work as expected).
  Bootsplash.hide();

  // Ensure the RNTP service gets destroyed on app close.
  return () => {
    TrackPlayer.reset().catch();
  };
}
