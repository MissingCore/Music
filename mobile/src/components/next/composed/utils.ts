// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

export type Spacing = "all" | "column" | "row" | "none";

/** Specifies the layout spacing for the component. */
export function getSpacingClasses(spacing?: Spacing) {
  if (!spacing || spacing === "all") return "mx-0.75 mb-1.5";
  else if (spacing === "row") return "mb-1.5";
  else if (spacing === "column") return "mx-0.75";
  return undefined;
}
