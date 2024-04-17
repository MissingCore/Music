import { Stack } from "expo-router";

import { useLoadAssets } from "@/hooks/useLoadAssets";

import "@/assets/global.css";
import { AppProvider } from "@/providers/app";
import { BackButton } from "@/components/BackButton";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/settings` keeps a back button present.
  initialRouteName: "(app)/(home)",
};

export default function RootLayout() {
  const { isLoaded } = useLoadAssets();
  if (!isLoaded) return null;
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <AppProvider>
      <Stack>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen
          name="current-track"
          options={{ animation: "slide_from_bottom", headerLeft: BackButton }}
        />
        <Stack.Screen name="setting" options={{ headerLeft: BackButton }} />
      </Stack>
    </AppProvider>
  );
}
