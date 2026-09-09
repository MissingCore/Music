// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { clsx } from "clsx";
import { defineConfig } from "cva/config";
import { extendTailwindMerge } from "tailwind-merge";

import { FontSize } from "~/constants/Styles";
import { FontFamily } from "~/modules/customization/font/core/constants";
import { ColorRoleOptions } from "~/modules/customization/theme/core/constants";

//#region Color
// Need to include `transparent` as otherwise, things will get merged incorrectly.
const AvailableColors = ["transparent", ...ColorRoleOptions] as const;
//#endregion

const customTwMerge = extendTailwindMerge({
  override: {
    theme: {
      color: AvailableColors,
    },
    classGroups: {
      "font-family": Object.keys(FontFamily),
      "font-size": [{ text: Object.keys(FontSize) }],
    },
  },
});

export const {
  cva,
  /** Combines any number of Tailwind classes nicely. */
  cx: cn,
} = defineConfig({
  cx: (...inputs) => customTwMerge(clsx(inputs)),
});
