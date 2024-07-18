export const AdjustmentOptions = [
  "album-fracturization",
  "artwork-retry",
  "invalid-tracks-retry",
] as const;

export type AdjustmentOption = (typeof AdjustmentOptions)[number];

/** History of data adjustments due to "breaking" changes. */
export const OverrideHistory: Record<
  number,
  { version: string; changes: AdjustmentOption[] }
> = {
  0: {
    version: "v1.0.0-rc.10",
    changes: ["invalid-tracks-retry", "artwork-retry", "album-fracturization"],
  },
};

/**
 * `file://` URI pointing to the directory where music is stored. Ends
 * with a trailing `/`.
 */
export const MUSIC_DIRECTORY = "file:///storage/emulated/0/Music/";
