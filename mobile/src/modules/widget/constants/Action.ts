// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

export const Action = {
  Open: "OPEN_APP",
  PlayPause: "PLAY_PAUSE",
  Prev: "PREV",
  Next: "NEXT",
} as const;

/** Have widget call specified action or open the app instead. */
export function withAction(action?: string, openApp?: boolean) {
  return openApp ? Action.Open : action;
}
