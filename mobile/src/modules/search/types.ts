import type {
  AlbumWithTracks,
  ArtistWithTracks,
  PlaylistWithTracks,
  TrackWithAlbum,
} from "@/db/schema";

import type { MediaType } from "@/modules/media/types";

/** Categories of media that can be returned by search. */
export type SearchCategories = ReadonlyArray<Exclude<MediaType, "folder">>;

/** Functions that can be triggered on the categories of media. */
export type SearchCallbacks = {
  album: (album: AlbumWithTracks) => void | Promise<void>;
  artist: (artist: ArtistWithTracks) => void | Promise<void>;
  // folder: (folder: unknown) => void | Promise<void>;
  playlist: (playlist: PlaylistWithTracks) => void | Promise<void>;
  track: (track: TrackWithAlbum) => void | Promise<void>;
};

/** Data that can be returned from search. */
export type SearchResults = {
  album: AlbumWithTracks[];
  artist: ArtistWithTracks[];
  // folder: unknown[];
  playlist: PlaylistWithTracks[];
  track: TrackWithAlbum[];
};
