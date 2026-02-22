export type GenreTrack = {
  id: string;
  name: string;
  artwork: string | null;
  duration: number;
  album: string | null;
  /** **Note:** May be empty. */
  artists: string[];
};
