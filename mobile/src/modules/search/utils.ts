import type { KeysOfValue } from "~/utils/types";

/**
 * Return entries whose value at the given key contains the query, priortizing
 * the values that starts with the query (both with case-insensitivity).
 */
export function containSorter<TData extends Record<string, any>>(
  sortedList: TData[],
  query: string,
  key: KeysOfValue<TData, string>,
) {
  const _query = query.toLocaleLowerCase();
  return matchSort(
    sortedList.filter((i) => lowerHas(i[key], _query)),
    (i) => lowerStart(i[key], _query),
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
export function lowerHas(str: string, containStr: string) {
  return str.toLocaleLowerCase().includes(containStr);
}

/** Returns if the lowercased string starts with another string. */
export function lowerStart(str = "", startStr: string) {
  return str.toLocaleLowerCase().startsWith(startStr);
}
