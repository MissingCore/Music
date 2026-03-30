export type EQPreset =
  | "Custom"
  | "Normal"
  | "Classical"
  | "Dance"
  | "Flat"
  | "Folk"
  | "Heavy Metal"
  | "Hip Hop"
  | "Jazz"
  | "Pop"
  | "Rock";

//#region Store
export interface EqualizerStore {
  /** Determines if the store has been hydrated from AsyncStorage. */
  _hasHydrated: boolean;
  /** Get a more accurate initial state. */
  _init: (state: EqualizerStore) => Promise<void>;

  enabled: boolean;
  /** Current active preset. */
  preset: EQPreset;
  /** Bands for "Custom" eq preset. */
  customBands: number[];

  defaultFrequencies: number[];
  defaultPresets: EQPreset[];
  minBandLevel: number;
  maxBandLevel: number;
  /** The max absolute value between `minBandLevel` & `maxBandLevel`. */
  bandOrdinate: number;
}

export const OmittedFields: string[] = [
  "_hasHydrated",
  "_init",
  "defaultFrequencies",
  "defaultPresets",
  "minBandLevel",
  "maxBandLevel",
  "bandOrdinate",
] satisfies Array<keyof EqualizerStore>;
//#endregion
