// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from "react";
import { View } from "react-native";

import { ThemeProvider } from "~/_next/context/theme-context";
import { useDimmedImageColor } from "~/_next/hooks/use-dimmed-image-color";

interface AdaptiveLayoutProps {
  artwork: string | null | undefined;
  children: React.ReactNode;
}

/** Generates custom theme based on "primary" artwork on screen. */
export function AdaptiveLayout(props: AdaptiveLayoutProps) {
  const backgroundColor = useDimmedImageColor(props.artwork);
  const AdaptiveTheme = useMemo(
    () =>
      ({
        background: backgroundColor,
        surface: "#FFFFFF",
        text: "#FFFFFF",
      }) as const,
    [backgroundColor],
  );

  return (
    <ThemeProvider scheme="dark" colors={AdaptiveTheme}>
      <View style={{ backgroundColor }} className="grow">
        {props.children}
      </View>
    </ThemeProvider>
  );
}
