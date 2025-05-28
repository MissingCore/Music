import type { Album, Artist, FileNode, Playlist, Track } from "~/db/schema";

/** What the `artwork` field typically holds. */
export type Artwork = string | null;

/** Minimum fields required to get `artwork` from tracks. */
export type TrackArtwork = {
  artwork: Artwork;
  album?: { artwork: Artwork } | null;
};

/** Minimum data typically used from `Album`. */
export type SlimAlbum = Pick<Album, "id" | "name" | "artistName" | "artwork">;
export type SlimAlbumWithTracks = SlimAlbum & { tracks: SlimTrack[] };

/** Minimum data typically used from `Artist`. */
export type SlimArtist = Pick<Artist, "name" | "artwork">;

/** Minimum data typically used from `Folder`. */
export type SlimFolder = FileNode & { tracks: SlimTrack[] };

/** Minimum data typically used from `Playlist`. */
export type SlimPlaylist = Pick<Playlist, "name" | "artwork">;
export type SlimPlaylistWithTracks = SlimPlaylist & { tracks: TrackArtwork[] };

/** Minimum data typically used from `Track`. */
export type SlimTrack = Pick<Track, "id" | "name" | "artistName" | "artwork">;
export type SlimTrackWithAlbum = SlimTrack & {
  album: { name: string; artwork: Artwork } | null;
};
