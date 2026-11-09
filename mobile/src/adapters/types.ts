// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

export namespace MediaDetails {
  interface MinItem {
    id: string;
    name: string;
    artwork: string | null;
  }

  export interface DisplayAlbum extends MinItem {
    year: string;
  }

  export interface DisplayTrack extends MinItem {
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

      topTracks: MediaDetails.DisplayTrack[];
      albums: MediaDetails.DisplayAlbum[];
      eps: MediaDetails.DisplayAlbum[];
      singles: MediaDetails.DisplayTrack[];
    }>;
  }
}

export interface Adapter<
  TArtistConnector extends Connector.Artist = Connector.Artist,
> {
  artist: TArtistConnector;
}
