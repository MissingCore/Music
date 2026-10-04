// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { cva } from "~/lib/style";
import { capitalize } from "~/utils/string";

//#region Intent
export type Intent = "unset" | "muted" | "primary" | "secondary" | "error";

/** Ensure the `intent` variant in our CVA styles follow our design system. */
export type IntentVariant = Record<Intent | (string & {}), string | null>;

type AccentRole = "primary" | "secondary" | "error";
const AccentRoleSet = new Set(["primary", "secondary", "error"]);
function isAccentRole(intent?: Intent): intent is AccentRole {
  if (!intent) return false;
  return AccentRoleSet.has(intent);
}

export function getIntentColor(intent?: Intent) {
  if (isAccentRole(intent)) return intent;
  return "surfaceContainerLowest";
}

export function getIntentOnColor(intent?: Intent) {
  if (isAccentRole(intent)) return `on${capitalize(intent)}` as const;
  return "onSurface";
}

export function getIntentRippleColor(intent?: Intent) {
  if (isAccentRole(intent)) return `${intent}Dim` as const;
  else if (intent === "muted") return "surfaceContainerHighest";
  return "surfaceContainerHigh";
}
//#endregion

//#region Styles
/** Base styles for creating a component. */
export const baseContainerStyle = cva({
  base: "overflow-hidden",
  variants: {
    intent: {
      unset: null,
      muted: null,
      primary: null,
      secondary: null,
      error: null,
    } satisfies IntentVariant,
    filled: { true: "bg-surfaceContainerLowest" },
    outline: { true: "border border-outlineVariant" },
  },
  compoundVariants: [
    { intent: "muted", filled: true, className: "bg-surfaceContainerHigh" },
    { intent: "primary", filled: true, className: "bg-primary" },
    { intent: "secondary", filled: true, className: "bg-secondary" },
    { intent: "error", filled: true, className: "bg-error" },
    { intent: "primary", outline: true, className: "border-primaryDim" },
    { intent: "secondary", outline: true, className: "border-secondaryDim" },
    { intent: "error", outline: true, className: "border-errorDim" },
  ],
  defaultVariants: { intent: "unset", filled: false, outline: false },
});
//#endregion
