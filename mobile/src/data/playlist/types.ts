export type PlaylistTrack = {
  id: string;
  name: string;
  artwork: string | null;
  artists: string[] | null;
  //? Used by "Export M3U" feature:
  duration: number;
  uri: string;
};
