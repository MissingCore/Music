/** Returns a copy of the array with the value at the specified index moved. */
export function moveArray<T>(
  arr: T[],
  movement: { fromIndex: number; toIndex: number },
) {
  const copy = [...arr];
  const moved = copy.splice(movement.fromIndex, 1);
  return copy.toSpliced(movement.toIndex, 0, moved[0]!);
}

/** Partion an array into 2 arrays based on a predicate. */
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
 * Shuffle a list of strings with the modern version of `Fisher-Yates`
 * Algorithm by Richard Durstenfeld.
 *  - https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
 */
export function shuffleArray<TData>(arr: TData[]) {
  const arrCpy = [...arr];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arrCpy[j], arrCpy[i]] = [arrCpy[i]!, arrCpy[j]!];
  }
  return arrCpy;
}

/** Return object with only the specified keys. */
export function pickKeys<T extends Record<PropertyKey, any>, K extends keyof T>(
  obj: T,
  keys: readonly K[],
) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, _val]) => keys.includes(key as K)),
  ) as Pick<T, K>;
}

/** Return object without the specified keys. */
export function omitKeys<T extends Record<PropertyKey, any>, K extends keyof T>(
  obj: T,
  keys: readonly K[],
) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, _val]) => !keys.includes(key as K)),
  ) as Omit<T, K>;
}
