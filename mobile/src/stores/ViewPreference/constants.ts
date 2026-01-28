//#region Layout
export const LayoutOptions = ["list", "grid", "compactGrid"] as const;

export type LayoutOption = (typeof LayoutOptions)[number];
//#endregion

//#region Store
export interface ViewPreferenceStore {
  /** Determines if the store has been hydrated from AsyncStorage. */
  _hasHydrated: boolean;
  /** Get a more accurate initial state. */
  _init: (state: ViewPreferenceStore) => Promise<void>;

  artistLayout: LayoutOption;
}

export const OmittedFields: string[] = [
  "_hasHydrated",
  "_init",
] satisfies Array<keyof ViewPreferenceStore>;
//#endregion
