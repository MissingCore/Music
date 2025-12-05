import { Toasts } from "@backpackapp-io/react-native-toast";
import { QueryClientProvider } from "@tanstack/react-query";
import { platformApiLevel } from "expo-device";
import { useMemo } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Provider as PaperProvider } from "react-native-paper";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { queryClient } from "~/lib/react-query";

/** All providers used by the app. */
export function AppProvider(props: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <PaperProvider>
          <GestureHandlerRootView>
            <QueryClientProvider client={queryClient}>
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
function ChildrenWrapper(props: { children: React.ReactNode }) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View
      style={{ paddingBottom: bottom }}
      className="flex-1 bg-canvas"
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
