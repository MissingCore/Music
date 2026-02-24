export type ArtistTrack = {
  id: string;
  name: string;
  artwork: string | null;
  album: string | null;
};

export type ArtistAlbum = {
  id: string;
  name: string;
  artwork: string | null;
  year: string;
};
