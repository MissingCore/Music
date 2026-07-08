// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

export type MigrationOption =
  | "hide-home-tab"
  | "hidden-tracks"
  | "multi-artist"
  | "favorites"
  | "onboarding-flow"
  | "clear-image-cache";

/**
 * History of data migrations due to "breaking" changes.
 *
 * TODO: When adding new entries, make sure to:
 *  - Remove the use of the `MigrationOption` in earlier changes. This
 *  helps prevent duplicate logic from being run if the user updates to
 *  the latest version from a very old version.
 *  - Periodically update the migration code to work with the latest
 *  version and have it work with any new changes we added (ie: if we
 *  add a new schema field).
 */
export const MigrationHistory: Record<
  number,
  { version: string; changes: MigrationOption[] }
> = {
  0: { version: "v2.3.0", changes: [] },
  1: { version: "v2.4.0", changes: [] },
  2: { version: "v2.6.0", changes: ["hide-home-tab"] },
  3: {
    version: "v3.0.0-rc.0",
    changes: ["onboarding-flow", "hidden-tracks", "multi-artist", "favorites"],
  },
  4: {
    version: "v3.4.0-rc.0",
    changes: ["clear-image-cache"],
  },
};
