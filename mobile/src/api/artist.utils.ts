/**
 * Replaces the `tracksToArtists` junction table field with a new `tracks`
 * field, where the tracks are sorted in alphabetical order.
 */
export function normalizeArtist<
  TArtistData extends { tracksToArtists: Array<{ track: { name: string } }> },
  TTrackData extends TArtistData["tracksToArtists"][number]["track"],
>(data: TArtistData) {
  const { tracksToArtists, ...rest } = data;
  const tracks = tracksToArtists
    .map(({ track }) => track)
    .sort((a, b) => a.name.localeCompare(b.name)) as TTrackData[];
  return { ...rest, tracks };
}
