export type AlbumTrack = {
  id: string;
  name: string;
  duration: number;
  disc: number | null;
  track: number | null;
  /** **Note:** May be empty. */
  artists: string[];
};
