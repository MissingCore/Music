// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

export interface LyricProvider {
  id: string;
  name: string;
  endpoint: string;
  /** We expect either JSON or Plain Text response from the endpoint. */
  isJSONResponse: boolean;
  /** Additional HTTP headers to pass with the request. It'll be a list of "Key: Value" pairs. */
  headers: string;
  /** List of fields we need to go through to get to the field with the lyrics. */
  traversedFields: string[];
}

//#region Store
export interface LyricStore {
  /** Determines if the store has been hydrated from AsyncStorage. */
  _hasHydrated: boolean;
  /** Get a more accurate initial state. */
  _init: (state: LyricStore) => Promise<void>;

  /** If lyrics will be displyad over the artwork on the Now Playing screen. */
  visible: boolean;
  /**
   * If embedded lyrics are checked. Useful in the situation where the embedded
   * lyrics check results in undesirable results.
   */
  checkEmbedded: boolean;
  /** List of online providers we can get lyrics from. */
  providers: LyricProvider[];
}

export const PersistedFields: string[] = [
  "visible",
  "checkEmbedded",
  "providers",
] satisfies Array<keyof LyricStore>;
//#endregion
