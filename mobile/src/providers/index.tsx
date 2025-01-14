import { Toasts } from "@backpackapp-io/react-native-toast";
import { QueryClientProvider } from "@tanstack/react-query";
import { View } from "react-native";
import { SheetProvider } from "react-native-actions-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import "@/screens/Sheets";
import { RouteHandlers } from "./RouteHandlers";
import { ThemeProvider } from "./ThemeProvider";

import { queryClient } from "@/lib/react-query";

/** All providers used by the app. */
export function AppProvider(props: { children: React.ReactNode }) {
  // NOTE: `expo-router` automatically adds `<SafeAreaProvider />`
  //  - https://docs.expo.dev/router/migrate/from-react-navigation/#delete-unused-or-managed-code
  return (
    <ThemeProvider>
      <GestureHandlerRootView>
        <QueryClientProvider client={queryClient}>
          <RouteHandlers />
          <SheetProvider context="global">
            <ChildrenWrapper {...props} />
            <Toasts />
          </SheetProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

function ChildrenWrapper(props: { children: React.ReactNode }) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={{ paddingBottom: bottom }} className="flex-1" {...props} />
  );
}
