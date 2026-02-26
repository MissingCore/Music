import type { CommonTrack } from "../types";

export type PlaylistTrack = CommonTrack & {
  //? Used by "Export M3U" feature:
  duration: number;
  uri: string;
};

export type PlaylistSummary = {
  /** The raw `name` field stored in the `Playlists` schema. */
  id: string;
  /** Parsed `name` field to translate `FavoritesPlaylistKey`. */
  name: string;
  artwork: string | Array<string | null> | null;
  duration: number;
  trackCount: number;
  isFavorite: boolean;
};

export type PlaylistSummaryTrack = {
  id: string;
  name: string;
  /** @deprecated */
  rawArtistName: string | null;
  album: string | null;
};
