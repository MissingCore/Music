import type { Maybe } from "./types";

/** Sort strings in ascending order, accounting for `undefined` values. */
export function compareAsc(a: Maybe<string>, b: Maybe<string>) {
  if (!a) return -1;
  if (!b) return 1;
  return a.localeCompare(b);
}
