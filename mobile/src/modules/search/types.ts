import type {
  SlimAlbumWithTracks,
  SlimArtist,
  SlimFolder,
  SlimTrackWithAlbum,
} from "~/db/slimTypes";

import type { PlaylistSummary } from "~/data/playlist/types";
import type { MediaType } from "~/stores/Playback/types";

/** Categories of media that can be returned by search. */
export type SearchCategories = ReadonlyArray<Exclude<MediaType, "genre">>;

/** Functions that can be triggered on the categories of media. */
export type SearchCallbacks = {
  album: (album: SlimAlbumWithTracks) => void | Promise<void>;
  artist: (artist: SlimArtist) => void | Promise<void>;
  folder: (folder: SlimFolder) => void | Promise<void>;
  playlist: (playlist: SearchPlaylistResult) => void | Promise<void>;
  track: (track: SlimTrackWithAlbum) => void | Promise<void>;
};

/** Data that can be returned from search. */
export type SearchResults = {
  album: SlimAlbumWithTracks[];
  artist: SlimArtist[];
  folder: SlimFolder[];
  playlist: SearchPlaylistResult[];
  track: SlimTrackWithAlbum[];
};

//#region Search Result Types
export type SearchPlaylistResult = Pick<PlaylistSummary, "name" | "artwork">;
//#endregion
