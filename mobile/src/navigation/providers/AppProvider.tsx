import { Toaster } from "@missingcore/toast";
import { QueryClientProvider } from "@tanstack/react-query";
import { NavigationBar } from "@zoontek/react-native-navigation-bar";
import { StatusBar, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Provider as PaperProvider } from "react-native-paper";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import "../../global.css";
import { ListenerStateStoreProvider } from "~/stores/ListenerState";
import { useCurrentTheme } from "~/hooks/useTheme";

import { queryClient } from "~/lib/react-query";
import { GestureHandlerRootView } from "~/components/Base/GestureHandlerRootView";

/** All providers used by the app. */
export function AppProvider(props: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <PaperProvider>
          <GestureHandlerRootView>
            <QueryClientProvider client={queryClient}>
              <SystemBars />
              <ListenerStateStoreProvider />
              <ChildrenWrapper {...props} />
              <Toaster />
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
    <>
      <StatusBar barStyle={`${iconColor}-content`} />
      <NavigationBar barStyle={`${iconColor}-content`} />
    </>
  );
}

function ChildrenWrapper(props: { children: React.ReactNode }) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View
      style={{ paddingBottom: bottom }}
      className="flex-1 bg-surface"
      {...props}
    />
  );
}
//#endregion
