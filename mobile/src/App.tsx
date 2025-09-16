import TrackPlayer from "@weights-ai/react-native-track-player";
import { View } from "react-native";
import Bootsplash from "react-native-bootsplash";

import { userPreferencesStore } from "~/services/UserPreferences";
import { useLoadResources } from "~/hooks/useLoadResources";
import { useNavigationTheme } from "~/hooks/useTheme";
import { AppProvider } from "~/providers";
import { Navigation } from "~/navigation/routes";
import { navigationRef } from "~/navigation/utils/router";
import { ErrorBoundary } from "~/screens/ErrorBoundary";
import { OnboardingScreen } from "~/screens/Onboarding";
import { TrackSheet } from "~/screens/Sheets/Track";

import "~/resources/global.css";
import "~/modules/i18n"; // Make sure translations are bundled.
import { SENTRY_ENABLED, Sentry } from "~/lib/sentry";

// Catch any errors thrown by the Layout component.
export { ErrorBoundary };

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

export default function App() {
  const { isLoaded, error } = useLoadResources();
  const navigationTheme = useNavigationTheme();

  if (error) {
    return (
      <>
        <View ref={handleAppLifeCycle} />
        {/* <ErrorBoundary error={error} retry={() => Promise.resolve()} /> */}
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
        <Navigation ref={navigationRef} theme={navigationTheme} />
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
    if (!userPreferencesStore.getState().continuePlaybackOnDismiss) {
      TrackPlayer.reset().catch();
    }
  };
}
