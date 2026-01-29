import type { ParseKeys } from "i18next";

import type { MutableOrder } from "./types";

//#region Layout
export const LayoutOptions = ["list", "grid", "compactGrid"] as const;

export type LayoutOption = (typeof LayoutOptions)[number];
//#endregion

//#region Sort
type SortOption =
  | "name"
  | "artistName"
  | "albumName"
  | "duration"
  | "trackCount"
  | "discoverTime"
  | "lastModified";

export const SortOptions = {
  album: ["name", "artistName", "duration", "trackCount"],
  artist: ["name", "duration", "trackCount"],
} as const satisfies Record<MutableOrder, SortOption[]>;

export type ScreenSortOptions<TScreen extends MutableOrder> =
  (typeof SortOptions)[TScreen][number];

export const SortOptionTranslation = {
  albumName: "term.album",
  artistName: "term.artist",
  discoverTime: "feat.modalViewPreference.extra.discover",
  duration: "feat.modalViewPreference.extra.duration",
  lastModified: "feat.modalViewPreference.extra.modified",
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

  albumLayout: LayoutOption;
  albumIsAsc: boolean;
  albumOrder: ScreenSortOptions<"album">;

  artistLayout: LayoutOption;
  artistIsAsc: boolean;
  artistOrder: ScreenSortOptions<"artist">;
}

export const OmittedFields: string[] = [
  "_hasHydrated",
  "_init",
] satisfies Array<keyof ViewPreferenceStore>;
//#endregion
