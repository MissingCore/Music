export type AlbumTrack = {
  id: string;
  name: string;
  duration: number;
  disc: number | null;
  track: number | null;
  artists: string[] | null;
};

export type AlbumSummary = {
  id: string;
  name: string;
  artistsKey: string;
  /** Used for home screen sorting. */
  artistName: string;
  artwork: string | null;
  duration: number;
  trackCount: number;
};
