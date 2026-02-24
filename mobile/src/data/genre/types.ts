export type GenreTrack = {
  id: string;
  name: string;
  artwork: string | null;
  duration: number;
  album: string | null;
  artists: string[] | null;
};
