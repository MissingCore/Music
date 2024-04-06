/**
 * @description Useful for narrowing types in arrays ONLY if we know the
 *  input array won't mutate.
 */
export function arrayIncludes<T>(arr: readonly T[], v: unknown): v is T {
  return arr.includes(v as T);
}
