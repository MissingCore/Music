/** Names of playlists a user can't create. */
export const ReservedPlaylists = {
  favorites: "Favorite Tracks",
  tracks: "Tracks",
} as const;

export type ReservedPlaylistName =
  (typeof ReservedPlaylists)[keyof typeof ReservedPlaylists];

/** A set of strings that we shouldn't allow to be used. */
export const ReservedNames = new Set<string>(Object.values(ReservedPlaylists));
