const MigrationOptions = [
  "v1-to-v2-store",
  "v1-to-v2-schema",
  "no-track-playlist-ref",
  "recheck-invalid-tracks",
  "fix-null-releaseYear",
  "artwork-retry",
] as const;

export type MigrationOption = (typeof MigrationOptions)[number];

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
  0: { version: "v1.0.0-rc.10", changes: [] },
  1: { version: "v1.0.0-rc.11", changes: [] },
  2: { version: "v1.0.0-rc.12", changes: [] },
  3: {
    version: "v2.0.0-rc.1",
    changes: ["v1-to-v2-store", "v1-to-v2-schema"],
  },
  4: { version: "v2.0.1", changes: ["no-track-playlist-ref"] },
  5: { version: "v2.1.1-rc.1", changes: ["fix-null-releaseYear"] },
  6: { version: "v2.1.2", changes: ["recheck-invalid-tracks"] },
  7: { version: "v2.1.4", changes: ["artwork-retry"] },
};
