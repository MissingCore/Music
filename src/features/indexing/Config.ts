export const AdjustmentOptions = [
  "album-fracturization",
  "artwork-retry",
  "invalid-tracks-retry",
  "library-scan",
] as const;

export type AdjustmentOption = (typeof AdjustmentOptions)[number];

/**
 * History of data adjustments due to "breaking" changes.
 *
 * TODO: When adding new entries, make sure to:
 *  - Remove the use of the `AdjustmentOption` in earlier changes. This
 *  helps prevent duplicate logic from being run if the user updates to
 *  the latest version from a very old version.
 *  - Periodically update the adjustment code to work with the latest
 *  version and have it work with any new changes we added (ie: if we
 *  add a new schema field).
 */
export const OverrideHistory: Record<
  number,
  { version: string; changes: AdjustmentOption[] }
> = {
  0: {
    version: "v1.0.0-rc.10",
    changes: ["artwork-retry", "album-fracturization"],
  },
  1: {
    version: "v1.0.0-rc.11",
    changes: ["invalid-tracks-retry", "library-scan"],
  },
};
