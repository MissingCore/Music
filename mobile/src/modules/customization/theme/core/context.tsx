// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { createContext, use, useMemo } from "react";
import { useColorScheme } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";

import type { ResolvedTheme } from "./constants";
import { SystemTheme, Themes } from "./constants";

const ThemeContext = createContext<ResolvedTheme>(SystemTheme);

type ThemeProviderProps = {
  children: React.ReactNode;
  theme?: Partial<ResolvedTheme>;
};

/** Can be used to partially update the theme values in a given subtree. */
export function ThemeProvider(props: ThemeProviderProps) {
  const parentTheme = use(ThemeContext);
  const theme = useMemo(
    () => ({ ...parentTheme, ...props.theme }),
    [parentTheme, props.theme],
  );
  return <ThemeContext value={theme}>{props.children}</ThemeContext>;
}

/** Theme provider to define at the top-level. */
export function RootThemeProvider(props: { children: React.ReactNode }) {
  const deviceScheme = useColorScheme();
  const preferredTheme = usePreferenceStore((state) => state.theme);
  const customTheme = usePreferenceStore((state) => state.activeCustomTheme);

  const theme = useMemo((): ResolvedTheme => {
    if (customTheme) {
      return { scheme: customTheme.scheme, ...customTheme.colors };
    }

    const scheme =
      preferredTheme === "system" ? (deviceScheme ?? "light") : preferredTheme;
    return Themes[scheme];
  }, [customTheme, deviceScheme, preferredTheme]);

  return <ThemeProvider theme={theme}>{props.children}</ThemeProvider>;
}

export function useTheme() {
  return use(ThemeContext);
}
