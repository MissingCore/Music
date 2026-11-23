// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from "react";
import type { ViewStyle } from "react-native";

import { useTheme } from "~/_next/context/theme-context";

import { withAlpha } from "~/_next/utils/color";

export function useBlurStyle() {
  const {
    colors: { background },
  } = useTheme();

  return useMemo<ViewStyle>(
    () => ({
      overflow: "hidden",
      backgroundImage: `
        linear-gradient(${withAlpha(background, 0.25)}, ${withAlpha(background, 0.25)}),
        linear-gradient(to bottom right, ${withAlpha("#FFF", 0.25)}, ${withAlpha("#FFF", 0.15)}),
        linear-gradient(to bottom right, ${withAlpha("#000", 0.05)}, ${withAlpha("#000", 0.2)}),
        linear-gradient(${withAlpha("#000", 0.1)}, ${withAlpha("#000", 0.05)})
      `,
      borderColor: withAlpha("#FFF", 0.2),
      borderWidth: 1,
    }),
    [background],
  );
}
