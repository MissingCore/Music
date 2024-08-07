import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import { useAtom, useSetAtom } from "jotai";
import { useEffect } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import Bootsplash from "react-native-bootsplash";
import TrackPlayer from "react-native-track-player";

import { EllipsisVertical } from "@/assets/svgs/EllipsisVertical";
import { useLoadResources } from "@/hooks/useLoadResources";
import { modalAtom } from "@/features/modal/store";

import "@/assets/global.css";
import { PlaybackService } from "@/constants/PlaybackService";
import { AppProvider } from "@/components/app-provider";
import {
  AnimatedBootSplash,
  shownIntroModalAtom,
} from "@/components/navigation/animated-boot-splash";
import { CurrentTrackHeader } from "@/components/navigation/header";
import { StyledPressable } from "@/components/ui/pressable";
import { Heading } from "@/components/ui/text";
import { AppModals } from "@/features/modal";
import { SettingModalsPortal } from "@/features/setting/components/modal";

import { ErrorBoundary } from "@/components/error/error-boundary";
// Catch any errors thrown by the Layout component.
export { ErrorBoundary };

export const unstable_settings = {
  // Ensure that reloading on `/settings` keeps a back button present.
  initialRouteName: "(app)/(home)",
};

Sentry.init({
  dsn: "https://bbd726405356cdfb20b85f5f924fd3e3@o4507687432617984.ingest.us.sentry.io/4507687447101440",
  ignoreErrors: [
    "Cannot complete operation because sound is not loaded.",
    "Player does not exist.",
    "Unable to activate keep awake",
  ],
});

TrackPlayer.registerPlaybackService(() => PlaybackService);

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
    return <AnimatedBootSplash />;
  }
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const openModal = useSetAtom(modalAtom);

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

      <IntroModal />
      <AppModals />
      <SettingModalsPortal />
    </AppProvider>
  );
}

/** Modal that explains that artwork will be saved in the background. */
function IntroModal() {
  const [shownIntroModal, setShownIntroModal] = useAtom(shownIntroModalAtom);

  return (
    <Modal
      animationType="fade"
      visible={shownIntroModal === undefined}
      onRequestClose={() => {
        setShownIntroModal(true);
      }}
      transparent
    >
      <View className="flex-1 items-center justify-center bg-canvas/50">
        <View className="m-4 rounded-xl bg-surface800 p-4">
          <Heading as="h2" className="mb-8">
            Quick Start
          </Heading>

          <Text className="mb-2 font-geistMono text-sm text-foreground50">
            Default Scanning
          </Text>
          <Text className="mb-6 font-geistMonoLight text-xs text-surface400">
            By default, <Text className="font-ndot57">Music</Text> will{" "}
            <Text className="text-foreground100">
              scan for tracks in the top-level `Music` directory
            </Text>{" "}
            on every storage device found. To change this behavior, update the
            filters in the `Library` screen in the settings page.
          </Text>

          <Text className="mb-2 font-geistMono text-sm text-foreground50">
            Artwork Saving
          </Text>
          <Text className="mb-10 font-geistMonoLight text-xs text-surface400">
            Track artwork is being saved in the background in an optimal manner.
            You may experience some UI lag as a result.
          </Text>

          <Pressable
            onPress={() => {
              setShownIntroModal(true);
            }}
            className="self-end px-4 py-2 active:opacity-75"
          >
            <Text className="font-geistMono text-base text-foreground100">
              Dismiss
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
