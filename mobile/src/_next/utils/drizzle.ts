// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys } from "i18next";

import i18next from "~/modules/i18n";

/** Ensures an item is defined or an array has at least 1 item. */
type DefinedResult<TData> = TData extends null | undefined
  ? never
  : TData extends Array<infer TItem>
    ? [TItem, ...TItem[]]
    : TData;

/** Throws specifed error if the query returns no results. */
export async function throwIfNoResults<TData>(
  query: Promise<TData>,
  errMsg: ParseKeys = "err.msg.noResults",
) {
  const result = await query;
  if (!result || (Array.isArray(result) && result.length === 0)) {
    throw new Error(i18next.t(errMsg));
  }
  return result as DefinedResult<TData>;
}
