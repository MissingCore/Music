import type {
  SlimAlbumWithTracks,
  SlimArtist,
  SlimPlaylistWithTracks,
  SlimTrackWithAlbum,
} from "~/db/slimTypes";

import type { MediaType } from "~/modules/media/types";

/** Categories of media that can be returned by search. */
export type SearchCategories = ReadonlyArray<Exclude<MediaType, "folder">>;

/** Functions that can be triggered on the categories of media. */
export type SearchCallbacks = {
  album: (album: SlimAlbumWithTracks) => void | Promise<void>;
  artist: (artist: SlimArtist) => void | Promise<void>;
  // folder: (folder: unknown) => void | Promise<void>;
  playlist: (playlist: SlimPlaylistWithTracks) => void | Promise<void>;
  track: (track: SlimTrackWithAlbum) => void | Promise<void>;
};

/** Data that can be returned from search. */
export type SearchResults = {
  album: SlimAlbumWithTracks[];
  artist: SlimArtist[];
  // folder: unknown[];
  playlist: SlimPlaylistWithTracks[];
  track: SlimTrackWithAlbum[];
};
