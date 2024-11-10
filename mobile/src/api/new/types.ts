import type { SQL } from "drizzle-orm";

//#region Database
/** Operations passed to `where` clause. */
export type DrizzleFilter = Array<SQL | undefined>;

/** Option of how we can filter for a single entry in the `where` clause. */
export type QueryCondition =
  | { id: string; filters?: DrizzleFilter }
  | { id?: string; filters: DrizzleFilter };

/** Arguments for querying a single entry in a table. */
export type QuerySingle = QueryCondition & { shouldThrow?: boolean };

/** Arguments for querying multiple entries in a table. */
export type QueryMultiple = { filters?: DrizzleFilter };
//#endregion

//#region PATCH
/** Arguments for favoriting a media entry. */
export type FavoriteArgs = QueryCondition & { isFavorite: boolean };
//#endregion
