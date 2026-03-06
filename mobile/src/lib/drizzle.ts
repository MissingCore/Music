import type { SQLWrapper } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { toSnakeCase } from "drizzle-orm/casing";
import type { AnySQLiteColumn, SQLiteColumn } from "drizzle-orm/sqlite-core";
import type { ParseKeys } from "i18next";

import i18next from "~/modules/i18n";

/*
  References:
    - https://orm.drizzle.team/docs/sql#sql-in-orderby
*/

/**
 * Case-insensitive `asc` function. If 2 values are the "same", the
 * uppercase one comes first.
 */
export const iAsc = (column: AnySQLiteColumn | SQLiteColumn | SQLWrapper) =>
  sql`${column} COLLATE NOCASE ASC, ${column} ASC`;

/**
 * Case-insensitive `desc` function. If 2 values are the "same", the
 * lowercase one comes first.
 */
export const iDesc = (column: AnySQLiteColumn | SQLiteColumn | SQLWrapper) =>
  sql`${column} COLLATE NOCASE DESC, ${column} DESC`;

/** Returns an object mapping columns to its `excluded.` notation. */
export function getExcludedColumns<T extends string>(columns: T[]) {
  return Object.fromEntries(
    columns.map((k) => [k, sql.raw(`excluded.${toSnakeCase(k)}`)]),
  );
}

/** Throws specifed error if the query returns no results. */
export async function throwIfNoResults<TData>(
  query: Promise<TData>,
  errMsg: ParseKeys = "err.msg.noResults",
) {
  const result = await query;
  if (!result || (Array.isArray(result) && result.length === 0)) {
    throw new Error(i18next.t(errMsg));
  }
  return result;
}
