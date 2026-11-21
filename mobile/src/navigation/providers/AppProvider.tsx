// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { Toaster } from "@missingcore/ui/toast";
import { QueryClientProvider } from "@tanstack/react-query";
import { NavigationBar } from "@zoontek/react-native-navigation-bar";
import { useMemo } from "react";
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
import { useShallow } from "zustand/react/shallow";

// @ts-expect-error - Can ignore `Cannot find module or type declarations for side-effect import`.
import "../../global.css";
import { ListenerStateStoreProvider } from "~/stores/ListenerState";
import { usePreferenceStore } from "~/stores/Preference/store";
import { ThemeProvider } from "~/_next/context/theme-context";

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
    <MinimumAppProvider>
      <QueryClientProvider client={queryClient}>
        <ListenerStateStoreProvider />
        {props.children}
        <ToastProvider />
        <SystemBars />
      </QueryClientProvider>
    </MinimumAppProvider>
  );
}

export function MinimumAppProvider(props: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider className="bg-surface">
      <UniwindListeners>
        <RootThemeProvider>
          <KeyboardProvider>
            <GestureHandlerRootView>{props.children}</GestureHandlerRootView>
          </KeyboardProvider>
        </RootThemeProvider>
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

//#region Root Theme Provider
function RootThemeProvider(props: { children: React.ReactNode }) {
  const currentTheme = useTheme();
  const translatedTheme = useMemo(
    () => ({
      background: currentTheme.surface,
      surface: currentTheme.surfaceContainerLowest,
      text: currentTheme.onSurface,
      accent: currentTheme.primary,
      secondary: currentTheme.secondary,
    }),
    [currentTheme],
  );

  const currentFonts = usePreferenceStore(
    useShallow((s) => ({ accent: s.accentFont, primary: s.primaryFont })),
  );

  return (
    <ThemeProvider
      scheme={currentTheme.scheme}
      colors={translatedTheme}
      fonts={currentFonts}
    >
      {props.children}
    </ThemeProvider>
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
