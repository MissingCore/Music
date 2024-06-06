/**
 * @description Useful for narrowing types in arrays ONLY if we know the
 *  input array won't mutate.
 */
export function arrayIncludes<T>(arr: readonly T[], v: unknown): v is T {
  return arr.includes(v as T);
}

/**
 * @description Partion an array into 2 arrays based on a predicate.
 */
export function partitionArray<TData>(
  arr: TData[],
  predicate: (data: TData) => boolean,
): [TData[], TData[]] {
  const pass: TData[] = [];
  const fail: TData[] = [];
  arr.forEach((el) => (predicate(el) ? pass.push(el) : fail.push(el)));

  return [pass, fail];
}

/**
 * @description Shuffle a list of strings with the modern version of
 *  `Fisher-Yates` Algorithm by Richard Durstenfeld.
 *  - https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
 */
export function shuffleArray(arr: string[]) {
  const arrCpy = [...arr];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arrCpy[j], arrCpy[i]] = [arrCpy[i]!, arrCpy[j]!];
  }
  return arrCpy;
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
