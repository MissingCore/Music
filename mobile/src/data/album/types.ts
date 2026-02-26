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
  //! FIXME: We probably want to fix this field.
  artistName: string;
  artwork: string | null;
  duration: number;
  trackCount: number;
};

export type AlbumSummaryTrack = {
  id: string;
  name: string;
  artwork: string | null;
  artists: string[] | null;
};
