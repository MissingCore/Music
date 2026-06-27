// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { Album, FileNode } from "~/db/schema";

import type { PlaylistSummary } from "~/data/playlist/types";
import type { CommonTrack } from "~/data/types";
import type { MediaType } from "~/stores/Playback/types";

/** Categories of media that can be returned by search. */
export type SearchCategories = ReadonlyArray<Exclude<MediaType, "genre">>;

/** Functions that can be triggered on the categories of media. */
export type SearchCallbacks = {
  album: (album: SearchAlbumResult) => void | Promise<void>;
  artist: (artist: SearchArtistResult) => void | Promise<void>;
  folder: (folder: SearchFolderResult) => void | Promise<void>;
  playlist: (playlist: SearchPlaylistResult) => void | Promise<void>;
  track: (track: CommonTrack) => void | Promise<void>;
};

/** Data that can be returned from search. */
export type SearchResults = {
  album: SearchAlbumResult[];
  artist: SearchArtistResult[];
  folder: SearchFolderResult[];
  playlist: SearchPlaylistResult[];
  track: CommonTrack[];
};

//#region Search Result Types
export type SearchAlbumResult = Pick<
  Album,
  "id" | "name" | "artistsKey" | "artwork"
> & {
  tracks: CommonTrack[];
};

export type SearchArtistResult = { name: string; artwork: string | null };

export type SearchFolderResult = FileNode & { tracks: CommonTrack[] };

export type SearchPlaylistResult = Pick<PlaylistSummary, "name" | "artwork">;
//#endregion
