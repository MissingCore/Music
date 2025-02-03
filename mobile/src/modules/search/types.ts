import type { Album, Artist, Playlist, Track } from "~/db/schema";

import type { MediaType } from "~/modules/media/types";

//#region Slim Types
type Artwork = string | null;
type TrackArtwork = { artwork: Artwork; album?: { artwork: Artwork } | null };
//#endregion

/** Categories of media that can be returned by search. */
export type SearchCategories = ReadonlyArray<Exclude<MediaType, "folder">>;

/** Minimum data returned for album for search. */
export type SearchAlbum = Pick<Album, "id" | "name" | "artistName" | "artwork">;
/** Minimum data returned for artist for search. */
export type SearchArtist = Pick<Artist, "name" | "artwork">;
/** Minimum data returned for playlist for search. */
export type SearchPlaylist = Pick<Playlist, "name" | "artwork"> & {
  tracks: TrackArtwork[];
};
/** Minimum data returned for track for search. */
export type SearchTrack = Pick<
  Track,
  "id" | "name" | "artistName" | "artwork"
> & { album?: Artwork };

/** Functions that can be triggered on the categories of media. */
export type SearchCallbacks = {
  album: (album: SearchAlbum) => void | Promise<void>;
  artist: (artist: SearchArtist) => void | Promise<void>;
  // folder: (folder: unknown) => void | Promise<void>;
  playlist: (playlist: SearchPlaylist) => void | Promise<void>;
  track: (track: SearchTrack) => void | Promise<void>;
};

/** Data that can be returned from search. */
export type SearchResults = {
  album: SearchAlbum[];
  artist: SearchArtist[];
  // folder: unknown[];
  playlist: SearchPlaylist[];
  track: SearchTrack[];
};
