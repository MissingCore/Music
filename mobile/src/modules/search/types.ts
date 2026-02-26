import type { Album, FileNode } from "~/db/schema";

//! FIXME: We probably want to import this from somewhere more "general".
import type { GenreTrack } from "~/data/genre/types";
import type { PlaylistSummary } from "~/data/playlist/types";
import type { MediaType } from "~/stores/Playback/types";

/** Categories of media that can be returned by search. */
export type SearchCategories = ReadonlyArray<Exclude<MediaType, "genre">>;

/** Functions that can be triggered on the categories of media. */
export type SearchCallbacks = {
  album: (album: SearchAlbumResult) => void | Promise<void>;
  artist: (artist: SearchArtistResult) => void | Promise<void>;
  folder: (folder: SearchFolderResult) => void | Promise<void>;
  playlist: (playlist: SearchPlaylistResult) => void | Promise<void>;
  track: (track: GenreTrack) => void | Promise<void>;
};

/** Data that can be returned from search. */
export type SearchResults = {
  album: SearchAlbumResult[];
  artist: SearchArtistResult[];
  folder: SearchFolderResult[];
  playlist: SearchPlaylistResult[];
  track: GenreTrack[];
};

//#region Search Result Types
export type SearchAlbumResult = Pick<
  Album,
  "id" | "name" | "artistsKey" | "artwork"
> & {
  tracks: GenreTrack[];
};

export type SearchArtistResult = { name: string; artwork: string | null };

export type SearchFolderResult = FileNode & { tracks: GenreTrack[] };

export type SearchPlaylistResult = Pick<PlaylistSummary, "name" | "artwork">;
//#endregion
