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
