// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { createContext } from "react";

import { capitalize } from "~/utils/string";

export type Intent = "unset" | "muted" | "primary" | "secondary" | "error";

/** Ensure the `intent` variant in our CVA styles follow our design system. */
export type IntentVariant = Record<Intent | (string & {}), string | null>;

/** Defines a default "intent" that components in the tree will follow against. */
export const ThemeIntentContext = createContext<Intent>("unset");

type AccentRole = "primary" | "secondary" | "error";
const AccentRoleSet = new Set(["primary", "secondary", "error"]);
function isAccentRole(intent: Intent): intent is AccentRole {
  return AccentRoleSet.has(intent);
}

export function getIntentColor(intent: Intent) {
  if (isAccentRole(intent)) return intent;
  return "surfaceContainerLowest";
}

export function getIntentOnColor(intent: Intent) {
  if (isAccentRole(intent)) return `on${capitalize(intent)}` as const;
  return "onSurface";
}

export function getIntentRippleColor(intent: Intent) {
  if (isAccentRole(intent)) return `${intent}Dim` as const;
  return "surfaceContainerHigh";
}
