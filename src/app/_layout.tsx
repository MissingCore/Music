import { Stack } from "expo-router";
import TrackPlayer from "react-native-track-player";

import { useLoadAssets } from "@/hooks/useLoadAssets";

import "@/assets/global.css";
import { PlaybackService } from "@/constants/PlaybackService";
import { AppProvider } from "@/providers/app";
import { Header } from "@/components/navigation/Header";
import { AnimatedBootSplash } from "@/components/navigation/AnimatedBootSplash";
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
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(app)" />
        <Stack.Screen
          name="current-track"
          options={{
            headerShown: true,
            animation: "slide_from_bottom",
            header: Header,
            headerTitle: "",
          }}
        />
        <Stack.Screen name="setting" />
        <Stack.Screen name="notification.click" />
      </Stack>

      <AppModals />
    </AppProvider>
  );
}
