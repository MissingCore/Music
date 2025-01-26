/** Get columns we want to select in the database schema. */
export function getColumns<T extends string>(keys?: T[]) {
  if (keys === undefined) return undefined;
  return Object.fromEntries(keys.map((key) => [key, true]));
}

/**
 * Creates the relations through the `with` operator for the `tracks`
 * field.
 *
 * **Note:** The type assertion on the result when it may not even be that
 * is to prevent an error being thrown with the `QueryOneWithTracksFn` type.
 */
export function withAlbum<U extends string>(options: {
  defaultWithAlbum: boolean;
  withAlbum?: boolean;
  albumColumns?: U[];
}) {
  return (
    (options.withAlbum ?? options.defaultWithAlbum) === true
      ? { with: { album: { columns: getColumns(options.albumColumns) } } }
      : {}
  ) as { with: { album: { columns: ReturnType<typeof getColumns> } } };
}
