import type { ParseKeys } from "i18next";

//#region Layout
export const LayoutOptions = ["list", "grid", "compactGrid"] as const;

export type LayoutOption = (typeof LayoutOptions)[number];
//#endregion

//#region Sort
export const ArtistSortOptions = ["name", "duration", "trackCount"] as const;

export type ArtistSortOption = (typeof ArtistSortOptions)[number];

export type SortOption = ArtistSortOption;

export const SortOptionTranslation = {
  duration: "feat.modalViewPreference.extra.duration",
  name: "feat.trackMetadata.extra.name",
  trackCount: "feat.modalViewPreference.extra.trackCount",
} as const satisfies Record<SortOption, ParseKeys>;
//#endregion

//#region Store
export interface ViewPreferenceStore {
  /** Determines if the store has been hydrated from AsyncStorage. */
  _hasHydrated: boolean;
  /** Get a more accurate initial state. */
  _init: (state: ViewPreferenceStore) => Promise<void>;

  artistLayout: LayoutOption;
  artistIsAsc: boolean;
  artistOrder: ArtistSortOption;
}

export const OmittedFields: string[] = [
  "_hasHydrated",
  "_init",
] satisfies Array<keyof ViewPreferenceStore>;
//#endregion
