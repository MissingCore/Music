import type { SQL } from "drizzle-orm";

//#region Database
/** Operations passed to `where` clause. */
export type DrizzleFilter = Array<SQL | undefined>;

/**
 * Function signature for querying a single entry in a table with type-safe
 * output.
 *
 * Note that a `@ts-expect-error` is required due to function overloading
 * not working as well with object arguments.
 */
export type QuerySingleFn<TData> = {
  (id: string, shouldThrow: false): Promise<TData | undefined>;
  (id: string, shouldThrow?: true): Promise<TData>;
};
//#endregion
