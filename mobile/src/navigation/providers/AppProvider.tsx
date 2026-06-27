// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { Toaster } from "@missingcore/ui/toast";
import { QueryClientProvider } from "@tanstack/react-query";
import { NavigationBar } from "@zoontek/react-native-navigation-bar";
import { useTranslation } from "react-i18next";
import { StatusBar, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import "../../global.css";
import { ListenerStateStoreProvider } from "~/stores/ListenerState";
import { usePreferenceStore } from "~/stores/Preference/store";

import { queryClient } from "~/lib/react-query";
import { GestureHandlerRootView } from "~/components/Base/GestureHandlerRootView";
import { getFont } from "~/modules/customization/font/utils";
import {
  useCurrentScheme,
  useTheme,
} from "~/modules/customization/theme/hooks";

/** All providers used by the app. */
export function AppProvider(props: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <GestureHandlerRootView>
          <QueryClientProvider client={queryClient}>
            <SystemBars />
            <ListenerStateStoreProvider />
            <ChildrenWrapper {...props} />
            <ToastProvider />
          </QueryClientProvider>
        </GestureHandlerRootView>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

//#region Edge-To-Edge
function SystemBars() {
  const currentTheme = useCurrentScheme();
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

//#region Toast Provider
function ToastProvider() {
  const { t } = useTranslation();
  const theme = useTheme();
  const primaryFont = usePreferenceStore((s) => s.primaryFont);

  return (
    <Toaster
      t={t}
      theme={{
        fontFamily: getFont(primaryFont),
        surface: theme.surfaceContainerLowest,
        onSurface: theme.onSurface,
        surfaceBorder: theme.surfaceContainerHigh,
        error: theme.error,
        onError: theme.onError,
      }}
    />
  );
}
//#endregion
