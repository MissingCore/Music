/** Generate a string listing out all the artists. */
export function getArtistsString<T extends boolean = true>(
  data: Array<{ artistName: string }>,
  withFallback?: T,
) {
  const _withFallback = withFallback === undefined ? true : withFallback;
  return (
    data.map((t) => t.artistName).join(", ") ||
    ((_withFallback ? "—" : null) as T extends true ? string : string | null)
  );
}
