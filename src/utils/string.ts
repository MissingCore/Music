/** @description Sort strings in ascending order, accounting for `undefined` values. */
export function compareAsc(a: string | undefined, b: string | undefined) {
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b);
}
