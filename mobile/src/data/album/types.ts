export type AlbumTrack = {
  id: string;
  name: string;
  duration: number;
  disc: number | null;
  track: number | null;
  artists: string[] | null;
};
