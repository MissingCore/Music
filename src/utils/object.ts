/**
 * @description Useful for narrowing types in arrays ONLY if we know the
 *  input array won't mutate.
 */
export function arrayIncludes<T>(arr: readonly T[], v: unknown): v is T {
  return arr.includes(v as T);
}

/** @description Return object with only the specified keys. */
export function pickKeys<T extends Record<PropertyKey, any>, K extends keyof T>(
  obj: T,
  keys: readonly K[],
) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, _val]) => keys.includes(key as K)),
  ) as Pick<T, K>;
}

/** @description Return object without the specified keys. */
export function omitKeys<T extends Record<PropertyKey, any>, K extends keyof T>(
  obj: T,
  keys: readonly K[],
) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, _val]) => !keys.includes(key as K)),
  ) as Omit<T, K>;
}
