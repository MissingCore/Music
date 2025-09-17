import { Toasts } from "@backpackapp-io/react-native-toast";
import { QueryClientProvider } from "@tanstack/react-query";
import { platformApiLevel } from "expo-device";
import { useMemo } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { DeepLinkHandler } from "./RouteHandlers";
import { SystemTheme, ThemeProvider } from "./ThemeProvider";

import { queryClient } from "~/lib/react-query";

/** All providers used by the app. */
export function AppProvider(props: ChildrenWrapperProps) {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <ThemeProvider>
          <GestureHandlerRootView>
            <QueryClientProvider client={queryClient}>
              <DeepLinkHandler />
              <ChildrenWrapper {...props} />
              <ToastProvider />
            </QueryClientProvider>
          </GestureHandlerRootView>
        </ThemeProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

//#region Edge-To-Edge
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
//#endregion

//#region Toast Provider
function ToastProvider() {
  const insets = useSafeAreaInsets();

  // Need to provide some extra insets for the global toast provider due
  // to Android API 35+ changing what we get for "height" from `useWindowDimensions()`.
  //  - https://github.com/facebook/react-native/issues/47080#issuecomment-2421914957
  const extraInsets = useMemo(() => {
    if (!platformApiLevel || platformApiLevel < 35) return undefined;
    return { bottom: insets.top + insets.bottom };
  }, [insets]);

  return <Toasts extraInsets={extraInsets} />;
}
//#endregion
