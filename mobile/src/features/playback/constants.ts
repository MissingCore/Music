/** "Enums" for special playlists. */
export const SpecialPlaylists = {
  favorites: "Favorite Tracks",
  tracks: "Tracks",
} as const;

export type SpecialPlaylistName =
  (typeof SpecialPlaylists)[keyof typeof SpecialPlaylists];

/** A set of strings that we shouldn't allow to be used. */
export const ReservedNames = new Set<string>(Object.values(SpecialPlaylists));
