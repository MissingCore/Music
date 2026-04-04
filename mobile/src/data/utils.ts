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

export function unencodeJSONArtworkArray(rawJSONString: string | null) {
  let results: Array<string | null> = [];
  // `rawJSONString` returns `string[]` or `null` as we use `NULLIF` to
  // prevent returning `[null]`.
  if (typeof rawJSONString === "string") {
    try {
      results = JSON.parse(rawJSONString).slice(0, 4);
    } catch {}
  }
  return results.length > 0 ? results : null;
}
