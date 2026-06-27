// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * The screen popping strategies offered when navigating to the artist screen.
 * - `popTo`: Uses the `pop` option in `navigate()`.
 * - `popScreen`: Calls `goBack()` on current screen before navigating.
 */
export type PopStrategy = "popTo" | "popScreen";
