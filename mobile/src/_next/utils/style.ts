// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

import { FONT_FAMILY, FONT_SIZE } from "../constants/theme";

const customTwMerge = extendTailwindMerge({
  override: {
    theme: {
      color: ["transparent"],
    },
    classGroups: {
      "font-family": [{ font: Object.keys(FONT_FAMILY) }],
      "font-size": [{ text: Object.keys(FONT_SIZE) }],
    },
  },
});

/** Combines any number of Tailwind classes nicely. */
export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}
