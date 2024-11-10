import type { SQL } from "drizzle-orm";

//#region Database
/** Operations passed to `where` clause. */
export type DrizzleFilter = Array<SQL | undefined>;

/** Arguments for querying a single entry in a table. */
export type QuerySingle =
  | { id: string; filters?: DrizzleFilter; shouldThrow?: boolean }
  | { id?: string; filters: DrizzleFilter; shouldThrow?: boolean };

/** Arguments for querying multiple entries in a table. */
export type QueryMultiple = { filters?: DrizzleFilter };
//#endregion

//#region PATCH
export type FavoriteArgs = { id: string; isFavorite: boolean };
//#endregion
