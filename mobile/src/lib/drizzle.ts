import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

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
