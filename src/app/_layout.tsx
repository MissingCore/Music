import { Stack } from "expo-router";
import { useSetAtom } from "jotai";
import TrackPlayer from "react-native-track-player";

import { EllipsisVertical } from "@/assets/svgs/EllipsisVertical";
import { useLoadAssets } from "@/hooks/useLoadAssets";
import { modalAtom } from "@/features/modal/store";

import "@/assets/global.css";
import { PlaybackService } from "@/constants/PlaybackService";
import { AppProvider } from "@/components/app-provider";
import { AnimatedBootSplash } from "@/components/navigation/animated-boot-splash";
import { CurrentTrackHeader } from "@/components/navigation/header";
import { StyledPressable } from "@/components/ui/pressable";
import { AppModals } from "@/features/modal";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "@/components/error/error-boundary";

export const unstable_settings = {
  // Ensure that reloading on `/settings` keeps a back button present.
  initialRouteName: "(app)/(home)",
};

TrackPlayer.registerPlaybackService(() => PlaybackService);

export default function RootLayout() {
  const { isLoaded } = useLoadAssets();
  if (!isLoaded) return <AnimatedBootSplash />;
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

      <AppModals />
    </AppProvider>
  );
}
