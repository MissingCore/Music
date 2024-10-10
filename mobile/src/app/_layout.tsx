import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import Bootsplash from "react-native-bootsplash";

import { EllipsisVertical } from "@/resources/icons/EllipsisVertical";
import { useLoadResources } from "@/hooks/useLoadResources";
import { OnboardingScreen } from "@/screens/Onboarding";
import { mediaModalAtom } from "@/modals/categories/media/store";
import { AppProvider } from "@/providers";

import "@/resources/global.css";
import "@/modules/i18n"; // Make sure translations are bundled.
import { ErrorBoundary } from "@/components/error/error-boundary";
import { CurrentTrackHeader } from "@/components/navigation/header";
import { StyledPressable } from "@/components/ui/pressable";
import { ModalPortal } from "@/modals";

// Catch any errors thrown by the Layout component.
export { ErrorBoundary };

export const unstable_settings = {
  // Ensure that reloading on `/settings` keeps a back button present.
  initialRouteName: "(app)/(home)",
};

Sentry.init({
  dsn: "https://bbd726405356cdfb20b85f5f924fd3e3@o4507687432617984.ingest.us.sentry.io/4507687447101440",
  ignoreErrors: [
    /Missing .* permissions/,
    // Expo development errors:
    "Unable to activate keep awake",
  ],
});

export default function RootLayout() {
  const { isLoaded, error } = useLoadResources();

  useEffect(() => {
    if (error) {
      // Display error message to user if encountered.
      Bootsplash.hide();
      // Send error message to Sentry. Doesn't send if you followed the
      // "Personal Privacy Build" documentation.
      if (!__DEV__) Sentry.captureException(error);
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
  const openModal = useSetAtom(mediaModalAtom);

  useEffect(() => {
    // Encountered issue in Android 12+ where one of the bootsplashes
    // persisted when it shouldn't. Make sure we close at least the bootsplash
    // from `react-native-bootsplash` whenever we render the app (in case its
    // "autohide" behavior doesn't work as expected).
    Bootsplash.hide();
  }, []);

  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(app)" />
        <Stack.Screen
          name="current-track"
          options={{
            headerShown: true,
            animation: "slide_from_bottom",
            header: CurrentTrackHeader,
            headerTitle: "",
            headerRight: () => (
              <StyledPressable
                accessibilityLabel="View track settings."
                onPress={() => openModal({ entity: "track", scope: "current" })}
                forIcon
              >
                <EllipsisVertical size={24} />
              </StyledPressable>
            ),
          }}
        />
        <Stack.Screen name="setting" />
        <Stack.Screen name="notification.click" />
      </Stack>

      <ModalPortal />
    </AppProvider>
  );
}
