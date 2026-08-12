// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { Toaster } from "@missingcore/ui/toast";
import { QueryClientProvider } from "@tanstack/react-query";
import { NavigationBar } from "@zoontek/react-native-navigation-bar";
import { useTranslation } from "react-i18next";
import { StatusBar, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import type { EdgeInsets } from "react-native-safe-area-context";
import {
  SafeAreaProvider as RawSafeAreaProvider,
  SafeAreaListener,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Uniwind, withUniwind } from "uniwind";

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

const SafeAreaProvider = withUniwind(RawSafeAreaProvider);

/** All providers used by the app. */
export function AppProvider(props: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider className="bg-surface">
      <UniwindListeners>
        <KeyboardProvider>
          <GestureHandlerRootView>
            <QueryClientProvider client={queryClient}>
              <ListenerStateStoreProvider />
              {props.children}
              <ToastProvider />
              <SystemBars />
            </QueryClientProvider>
          </GestureHandlerRootView>
        </KeyboardProvider>
      </UniwindListeners>
    </SafeAreaProvider>
  );
}

export function MinimumAppProvider(props: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider className="bg-surface">
      <UniwindListeners>
        <KeyboardProvider>
          <GestureHandlerRootView>{props.children}</GestureHandlerRootView>
        </KeyboardProvider>
      </UniwindListeners>
    </SafeAreaProvider>
  );
}

//#region Edge-To-Edge
const onSafeAreaChange = ({ insets }: { insets: EdgeInsets }) =>
  Uniwind.updateInsets(insets);

function UniwindListeners(props: { children: React.ReactNode }) {
  return (
    <SafeAreaListener onChange={onSafeAreaChange}>
      {props.children}
    </SafeAreaListener>
  );
}

function SystemBars() {
  const { bottom } = useSafeAreaInsets();
  const currentTheme = useCurrentScheme();
  const iconColor = currentTheme === "light" ? "dark" : "light";

  return (
    <>
      <StatusBar barStyle={`${iconColor}-content`} />
      <NavigationBar barStyle={`${iconColor}-content`} />

      <View
        style={{ paddingBottom: bottom }}
        className="absolute right-0 bottom-0 left-0 bg-androidNavbar"
      />
    </>
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
