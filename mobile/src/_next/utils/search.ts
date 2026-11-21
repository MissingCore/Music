// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Return entries whose value at the given key contains the query, priortizing
 * the values that starts with the query (both with case-insensitivity).
 */
export function containSorter<TData extends Record<string, any>>(
  sortedList: TData[],
  query: string,
  keys: Array<keyof TData>,
) {
  const _query = query.toLocaleLowerCase();
  return matchSort(
    sortedList.filter((i) => keys.some((key) => lowerHas(i[key], _query))),
    (i) => keys.some((key) => lowerStart(i[key], _query)),
  );
}

/** Further sort a sorted list based on an additional constraint. */
export function matchSort<TData extends Record<string, any>>(
  sortedList: TData[],
  matcher: (item: TData) => boolean,
) {
  const goodMatch: TData[] = [];
  const partialMatch: TData[] = [];
  sortedList.forEach((item) => {
    if (matcher(item)) goodMatch.push(item);
    else partialMatch.push(item);
  });
  return goodMatch.concat(partialMatch);
}

/** Returns if the lowercased string contains another string. */
export function lowerHas(str: unknown, containStr: string) {
  if (typeof str !== "string") return false;
  return str.toLocaleLowerCase().includes(containStr);
}

/** Returns if the lowercased string starts with another string. */
export function lowerStart(str: unknown, startStr: string) {
  if (typeof str !== "string") return false;
  return str.toLocaleLowerCase().startsWith(startStr);
}
