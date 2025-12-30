export type MigrationOption =
  | "fileNodes-adjustment"
  | "discover-time-field"
  | "recent-list-db-migration"
  | "hide-home-tab"
  | "hidden-tracks";

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
  0: { version: "v2.3.0", changes: ["fileNodes-adjustment"] },
  1: {
    version: "v2.4.0",
    changes: ["discover-time-field", "recent-list-db-migration"],
  },
  2: { version: "v2.6.0", changes: ["hide-home-tab"] },
  3: { version: "v3.0.0-rc.0", changes: ["hidden-tracks"] },
};
