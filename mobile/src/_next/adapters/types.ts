// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

export namespace MediaItem {
  interface Base {
    id: string;
    name: string;
    artwork: string | null;
  }

  export interface DisplayAlbum extends Base {
    year: string;
  }

  export interface DisplayTrack extends Base {
    album: string | null;
  }
}

export namespace Connector {
  export interface Artist {
    /** Get information about this artist (including discography). */
    get(id: string): Promise<{
      name: string;
      artwork: string | null;
      numTracks: number;
      totalDuration: number;

      topTracks: MediaItem.DisplayTrack[];
      albums: MediaItem.DisplayAlbum[];
      eps: MediaItem.DisplayAlbum[];
      /** Includes tracks by this artist that appear in albums not by this artist. */
      singles: MediaItem.DisplayTrack[];

      albumApperances: MediaItem.DisplayAlbum[];
      genres: string[];
    }>;

    /** Return a list of track ids (with no sort preference). */
    getTrackIds(id: string): Promise<Array<{ id: string }>>;
  }
}

export interface Adapter<
  TArtistConnector extends Connector.Artist = Connector.Artist,
> {
  artist: TArtistConnector;
}
