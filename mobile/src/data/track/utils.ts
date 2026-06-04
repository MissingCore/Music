/**
 * Merge 2 lists of tracks. Tracks that appear in both lists will result
 * in the latest instance of the track being merged so that there'll be
 * no duplicates.
 */
export function mergeTracks<TData extends { id: string }>(
  list1: TData[],
  list2: TData[],
) {
  const trackIds = new Set(list2.map(({ id }) => id));
  return list1.filter(({ id }) => !trackIds.has(id)).concat(list2);
}
