export function unencodeJSONArray(rawJSONString: string) {
  let results: string[] = [];
  try {
    // `rawJSONString` can be `[null]` or `string[]`.
    const asArr: Array<string | null> = JSON.parse(rawJSONString);
    results = asArr.filter((name) => name !== null);
  } catch {}
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
