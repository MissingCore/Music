export type ArtistTrack = {
  id: string;
  name: string;
  artwork: string | null;
  duration: number;
  album: string | null;
};

export type ArtistAlbum = {
  id: string;
  name: string;
  artwork: string | null;
  year: string;
};
