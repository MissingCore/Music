export const AdjustmentOptions = [
  "album-fracturization",
  "fetchedArt",
] as const;

export type AdjustmentOption = (typeof AdjustmentOptions)[number];

/** History of data adjustments due to "breaking" changes. */
export const OverrideHistory: Record<
  number,
  { version: string; changes: AdjustmentOption[] }
> = {
  0: {
    version: "v1.0.0-rc.10",
    changes: ["fetchedArt", "album-fracturization"],
  },
};
