export type OutputType = "string" | "object" | "array";

export interface LyricProvider {
  id: string;
  name: string;
  endpoint: string;
  /** Additional HTTP headers to pass with the request. */
  httpHeaders: Array<[string, string]>;
  /** The type of response we expect. */
  responseType: OutputType;
  /** Steps to get to the field containing the lyrics. */
  traversal: Array<{ field: string; type: OutputType }>;
}

//#region Store
export interface LyricStore {
  /** Determines if the store has been hydrated from AsyncStorage. */
  _hasHydrated: boolean;
  /** Get a more accurate initial state. */
  _init: (state: LyricStore) => Promise<void>;

  /** If lyrics will be displyad over the artwork on the Now Playing screen. */
  visible: boolean;
  /** List of online providers we can get lyrics from. */
  providers: LyricProvider[];
}

export const PersistedFields: string[] = [
  "visible",
  "providers",
] satisfies Array<keyof LyricStore>;
//#endregion
