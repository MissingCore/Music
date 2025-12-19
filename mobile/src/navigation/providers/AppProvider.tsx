import { Toasts } from "@backpackapp-io/react-native-toast";
import { QueryClientProvider } from "@tanstack/react-query";
import { platformApiLevel } from "expo-device";
import { useMemo } from "react";
import { View } from "react-native";
import { SystemBars as DeviceSystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Provider as PaperProvider } from "react-native-paper";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import "../../global.css";
import { useCurrentTheme } from "~/hooks/useTheme";

import { queryClient } from "~/lib/react-query";

/** All providers used by the app. */
export function AppProvider(props: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <PaperProvider>
          <GestureHandlerRootView>
            <QueryClientProvider client={queryClient}>
              <SystemBars />
              <ChildrenWrapper {...props} />
              <ToastProvider />
            </QueryClientProvider>
          </GestureHandlerRootView>
        </PaperProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

//#region Edge-To-Edge
function SystemBars() {
  const currentTheme = useCurrentTheme();
  const iconColor = currentTheme === "light" ? "dark" : "light";
  return (
    <DeviceSystemBars
      style={{ statusBar: iconColor, navigationBar: iconColor }}
    />
  );
}

function ChildrenWrapper(props: { children: React.ReactNode }) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View
      style={{ paddingBottom: bottom }}
      className="bg-canvas flex-1"
      {...props}
    />
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
