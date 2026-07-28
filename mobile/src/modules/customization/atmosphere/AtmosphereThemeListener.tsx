// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useEffect } from "react";
import { Uniwind } from "uniwind";

import type { ColorRole, HexColor } from "../theme/core/constants";
import { useTheme } from "../theme/hooks";

const UpdatedColorRoles = [
  "primary",
  "primaryDim",
  "onPrimary",
  "onPrimaryVariant",
  "secondary",
  "secondaryDim",
  "onSecondary",
  "onSecondaryVariant",
] as const satisfies ColorRole[];

export function AtmosphereThemeListener() {
  const theme = useTheme();

  useEffect(() => {
    const updatedVariables: Record<string, HexColor> = {};
    UpdatedColorRoles.forEach((role) => {
      updatedVariables[`--color-${role}`] = theme[role];
    });

    Uniwind.updateCSSVariables("atmosphere", updatedVariables);
  }, [theme]);

  return null;
}
