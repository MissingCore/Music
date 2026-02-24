export function unencodeJSONArray(rawJSONString: string) {
  let results: string[] = [];
  try {
    // `rawJSONString` can be `[null]` or `string[]`.
    const asArr: Array<string | null> = JSON.parse(rawJSONString);
    results = asArr.filter((name) => name !== null);
  } catch {}
  return results.length > 0 ? results : null;
}
