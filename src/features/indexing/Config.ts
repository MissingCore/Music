export const AdjustmentOptions = [
  "album-fracturization",
  "artwork-retry",
  "invalid-tracks-retry",
  "library-scan",
] as const;

export type AdjustmentOption = (typeof AdjustmentOptions)[number];

/** History of data adjustments due to "breaking" changes. */
export const OverrideHistory: Record<
  number,
  { version: string; changes: AdjustmentOption[] }
> = {
  0: {
    version: "v1.0.0-rc.10",
    changes: [
      "artwork-retry",
      "invalid-tracks-retry",
      "album-fracturization",
      "library-scan",
    ],
  },
  1: {
    version: "v1.0.0-rc.11",
    changes: ["invalid-tracks-retry"],
  },
};

/**
 * `file://` URI pointing to the directory where music is stored. Ends
 * with a trailing `/`.
 */
export const MUSIC_DIRECTORY = "file:///storage/emulated/0/Music/";
