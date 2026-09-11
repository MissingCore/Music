// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { createContext } from "react";

export type Intent = "unset" | "muted" | "primary" | "secondary" | "error";

/** Ensure the `intent` variant in our CVA styles follow our design system. */
export type IntentVariant = Record<Intent | (string & {}), string | null>;

/** Defines a default "intent" that components in the tree will follow against. */
export const ThemeIntentContext = createContext<Intent>("unset");

export function getIntentOnColor(intent: Intent) {
  if (intent === "muted") return "onSurfaceVariant";
  else if (intent === "primary") return "onPrimary";
  else if (intent === "secondary") return "onSecondary";
  else if (intent === "error") return "onError";
  return "onSurface";
}

export function getIntentRippleColor(intent: Intent) {
  if (intent === "primary") return "primaryDim";
  else if (intent === "secondary") return "secondaryDim";
  else if (intent === "error") return "errorDim";
  return "surfaceContainerHigh";
}
