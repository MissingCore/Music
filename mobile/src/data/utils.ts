export function commonTracksOrIds<
  TResult extends Record<string, any>,
  TOnlyIds extends boolean | undefined = false,
>(data: Array<Record<string, unknown>>, onlyIds?: TOnlyIds) {
  return (
    onlyIds
      ? data
      : data.map(({ artists, ...rest }) => ({
          ...rest,
          artists: fromJSONArrayString(artists as string),
        }))
  ) as TOnlyIds extends true ? Array<{ id: string }> : TResult[];
}

export function fromJSONArrayString(rawJSONString: string | null | unknown) {
  let results: string[] = [];
  // `rawJSONString` returns `string[]` or `null` as we use `NULLIF` to
  // prevent returning `[null]`.
  if (typeof rawJSONString === "string") {
    try {
      results = JSON.parse(rawJSONString);
    } catch {}
  }
  return results.length > 0 ? results : null;
}

export function unencodeJSONArtworkArray(
  rawJSONString: string,
  isEmpty: boolean,
) {
  let results: Array<string | null> = [];
  try {
    // `rawJSONString` can be `[null]` or `string[]`.
    const asArr: Array<string | null> = JSON.parse(rawJSONString);
    results = asArr.slice(0, 4);
  } catch {}
  //? `rawJSONString` will default to `[null]` if the array is supposed to be empty.
  if (isEmpty && results.length === 1 && results[0] === null) return null;
  return results.length > 0 ? results : null;
}
