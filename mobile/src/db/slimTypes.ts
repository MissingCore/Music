import type { Album, Artist, FileNode, Genre, Track } from "~/db/schema";

import type { Artwork } from "~/api/track.utils";

/** Minimum data typically used from `Album`. */
export type SlimAlbum = Pick<Album, "id" | "name" | "artistsKey" | "artwork">;
export type SlimAlbumWithTracks = SlimAlbum & { tracks: SlimTrack[] };

/** Minimum data typically used from `Artist`. */
export type SlimArtist = Pick<Artist, "name" | "artwork">;

/** Minimum data typically used from `Folder`. */
export type SlimFolder = FileNode & { tracks: SlimTrackWithAlbum[] };

/** Minimum data typically used from `Genre`. */
export type SlimGenre = Pick<Genre, "name" | "artwork">;

/** Minimum data typically used from `Track`. */
export type SlimTrack = Pick<Track, "id" | "name" | "artwork"> & {
  tracksToArtists: Array<{ artistName: string }>;
};
export type SlimTrackWithAlbum = SlimTrack & {
  album: { name: string; artwork: Artwork } | null;
};
