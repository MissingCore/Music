export type MigrationOption =
  | "kv-store"
  | "fileNodes-adjustment"
  | "duplicate-album-fix";

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
  0: { version: "v2.3.0", changes: ["kv-store", "fileNodes-adjustment"] },
  1: { version: "v2.4.0", changes: ["duplicate-album-fix"] },
};
