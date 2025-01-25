/** Get columns we want to select in the database schema. */
export function getColumns<T extends string>(keys: T[] | undefined) {
  if (keys === undefined) return undefined;
  return Object.fromEntries(keys.map((key) => [key, true]));
}
