export const KEY_SEPARATOR = "[joiner]";

/** Helper function for generating & using `artistsKey`. */
export const AlbumArtistsKey = {
  /** Generate `artistsKey` from list of artist names. */
  from(artistNames: string[]) {
    const filteredArtistNames = artistNames
      .map((name) => name.trim())
      .filter((name) => !!name);
    if (filteredArtistNames.length === 0) return null;
    // Ensure consistent ordering in `artistsKey` through case-insensitive sorting.
    return filteredArtistNames
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
      .join(KEY_SEPARATOR);
  },

  /** Get the artist names that make up an `artistsKey`. */
  deconstruct(artistsKey: string) {
    return artistsKey.split(KEY_SEPARATOR).filter((name) => !!name);
  },

  /** Make `artistsKey` presentable as a string. */
  toString(artistsKey: string) {
    return this.deconstruct(artistsKey).join(", ");
  },
};
