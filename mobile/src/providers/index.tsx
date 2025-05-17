import { Toasts } from "@backpackapp-io/react-native-toast";
import { QueryClientProvider } from "@tanstack/react-query";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RouteHandlers } from "./RouteHandlers";
import { SystemTheme, ThemeProvider } from "./ThemeProvider";

import { queryClient } from "~/lib/react-query";

/** All providers used by the app. */
export function AppProvider(props: ChildrenWrapperProps) {
  // NOTE: `expo-router` automatically adds `<SafeAreaProvider />`
  //  - https://docs.expo.dev/router/migrate/from-react-navigation/#delete-unused-or-managed-code
  return (
    <ThemeProvider>
      <GestureHandlerRootView>
        <QueryClientProvider client={queryClient}>
          <RouteHandlers />
          <ChildrenWrapper {...props} />
          <Toasts />
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

type ChildrenWrapperProps = {
  children: React.ReactNode;
  systemTheme?: boolean;
};

function ChildrenWrapper(props: ChildrenWrapperProps) {
  const { bottom } = useSafeAreaInsets();

  if (props.systemTheme) {
    return (
      <SystemTheme style={{ paddingBottom: bottom }}>
        <View className="flex-1" {...props} />
      </SystemTheme>
    );
  }

  return (
    <View style={{ paddingBottom: bottom }} className="flex-1" {...props} />
  );
}
