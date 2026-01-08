/** Helper functions for a list of tracks. */
export const TrackList = {
  /**
   * Merge 2 lists of tracks. Tracks that appear in both lists will result
   * in the latest instance of the track being merged so that there'll be
   * no duplicates.
   */
  merge<TData extends { id: string }>(list1: TData[], list2: TData[]) {
    const trackIds = new Set(list2.map(({ id }) => id));
    return list1.filter(({ id }) => !trackIds.has(id)).concat(list2);
  },

  /** Returns the year range from the `year` field on tracks. */
  yearRange<TData extends { year: number | null }>(trackList: TData[]) {
    const years = trackList
      .filter(({ year }) => year !== null)
      .map(({ year }) => year) as number[];
    if (years.length === 0) return { minYear: -1, maxYear: -1, range: null };
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const range =
      minYear === maxYear ? `${maxYear}` : `${minYear} - ${maxYear}`;
    return { minYear, maxYear, range };
  },
};

//#region Artwork
/** What the `artwork` field typically holds. */
export type Artwork = string | null;

/** Minimum fields required to get `artwork` from tracks. */
export type TrackArtwork = {
  artwork: Artwork;
  album?: { artwork: Artwork } | null;
};

/** Get artwork representing track. */
export function getTrackArtwork(track: TrackArtwork) {
  return track.artwork ?? track.album?.artwork ?? null;
}
//#endregion
