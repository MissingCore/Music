import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { toSnakeCase } from "drizzle-orm/casing";

/*
  References:
    - https://orm.drizzle.team/docs/sql#sql-in-orderby
*/

/**
 * Case-insensitive `asc` function. If 2 values are the "same", the
 * uppercase one comes first.
 */
export const iAsc = (column: SQLiteColumn) =>
  sql`${column} COLLATE NOCASE ASC, ${column} ASC`;

/**
 * Case-insensitive `desc` function. If 2 values are the "same", the
 * lowercase one comes first.
 */
export const iDesc = (column: SQLiteColumn) =>
  sql`${column} COLLATE NOCASE DESC, ${column} DESC`;

/**
 * Return an object for the `columns` field in Drizzle's Query
 * Builder that returns the specified columns.
 */
export function withColumns<T extends string>(columns: T[]) {
  const columnsObj = Object.fromEntries(columns.map((col) => [col, true]));
  return columnsObj as Record<T, true>;
}

/** Returns an object mapping columns to its `excluded.` notation. */
export function getExcludedColumns<T extends string>(columns: T[]) {
  return Object.fromEntries(
    columns.map((k) => [k, sql.raw(`excluded.${toSnakeCase(k)}`)]),
  );
}
