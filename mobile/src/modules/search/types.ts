import type {
  SlimAlbumWithTracks,
  SlimArtist,
  SlimFolder,
  SlimPlaylistWithTracks,
  SlimTrackWithAlbum,
} from "~/db/slimTypes";

import type { MediaType } from "~/stores/Playback/types";

/** Categories of media that can be returned by search. */
export type SearchCategories = readonly MediaType[];

/** Functions that can be triggered on the categories of media. */
export type SearchCallbacks = {
  album: (album: SlimAlbumWithTracks) => void | Promise<void>;
  artist: (artist: SlimArtist) => void | Promise<void>;
  folder: (folder: SlimFolder) => void | Promise<void>;
  playlist: (playlist: SlimPlaylistWithTracks) => void | Promise<void>;
  track: (track: SlimTrackWithAlbum) => void | Promise<void>;
};

/** Data that can be returned from search. */
export type SearchResults = {
  album: SlimAlbumWithTracks[];
  artist: SlimArtist[];
  folder: SlimFolder[];
  playlist: SlimPlaylistWithTracks[];
  track: SlimTrackWithAlbum[];
};
