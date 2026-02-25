export type PlaylistTrack = {
  id: string;
  name: string;
  artwork: string | null;
  artists: string[] | null;
  //? Used by "Export M3U" feature:
  duration: number;
  uri: string;
};

export type PlaylistSummary = {
  id: string;
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
