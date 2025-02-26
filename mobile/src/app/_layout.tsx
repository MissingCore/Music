import { Stack } from "expo-router";
import { useEffect } from "react";
import Bootsplash from "react-native-bootsplash";
import TrackPlayer from "react-native-track-player";

import { musicStore } from "~/modules/media/services/Music";
import { useLoadResources } from "~/hooks/useLoadResources";
import { ErrorBoundary } from "~/screens/ErrorBoundary";
import { OnboardingScreen } from "~/screens/Onboarding";
import { AppProvider } from "~/providers";

import "~/resources/global.css";
import "~/modules/i18n"; // Make sure translations are bundled.
import { TopAppBar, TopAppBarMarquee } from "~/components/TopAppBar";

// Catch any errors thrown by the Layout component.
export { ErrorBoundary };

export const unstable_settings = {
  // Ensure that reloading on `/settings` keeps a back button present.
  initialRouteName: "(main)/(home)",
};

let Sentry: any;
const WithSentry = process.env.EXPO_PUBLIC_PRIVACY_BUILD !== "true";

if (WithSentry) {
  // Dynamically import Sentry if we want to use it.
  Sentry = require("@sentry/react-native");
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

  // Ensure the RNTP service closes on app close.
  useEffect(() => {
    return () => {
      TrackPlayer.reset().catch();
    };
  }, []);

  useEffect(() => {
    if (error) {
      // Display error message to user if encountered.
      Bootsplash.hide();
      musicStore.getState().resetOnCrash();
      // Send error message to Sentry.
      if (WithSentry && !__DEV__) Sentry.captureException(error);
    }
  }, [error]);

  if (error) {
    return <ErrorBoundary error={error} retry={() => Promise.resolve()} />;
  } else if (!isLoaded) {
    return (
      <AppProvider>
        <OnboardingScreen />
      </AppProvider>
    );
  }
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  useEffect(() => {
    // Encountered issue in Android 12+ where one of the bootsplashes
    // persisted when it shouldn't. Make sure we close at least the bootsplash
    // from `react-native-bootsplash` whenever we render the app (in case its
    // "autohide" behavior doesn't work as expected).
    Bootsplash.hide();
  }, []);

  return (
    <AppProvider>
      <Stack screenOptions={{ header: TopAppBar, headerShown: false }}>
        <Stack.Screen name="(main)" />
        <Stack.Screen
          name="now-playing"
          options={{
            animation: "slide_from_bottom",
            header: TopAppBarMarquee,
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
    </AppProvider>
  );
}
