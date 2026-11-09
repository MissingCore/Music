// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

export namespace MediaDetails {
  interface MinItem {
    id: string;
    name: string;
    artwork: string | null;
  }

  export interface MinAlbum extends MinItem {
    year: string;
  }

  export interface MinTrack extends MinItem {
    album: string | null;
  }
}

export namespace Connector {
  export interface Artist {
    /** Get information about this artist. */
    get(id: string): Promise<{
      name: string;
      artwork: string | null;
      numTracks: number;
      totalDuration: number;

      topTracks: MediaDetails.MinTrack[];
      albums: MediaDetails.MinAlbum[];
      eps: MediaDetails.MinAlbum[];
      singles: MediaDetails.MinTrack[];
    }>;
    /** Get top tracks for this artist. */
    getTopTracks(id: string): Promise<MediaDetails.MinTrack[]>;
    /** Get albums sorted by release year. */
    getAlbums(id: string): Promise<MediaDetails.MinAlbum[]>;
    /** Get EPs sorted by release year. */
    getEPs(id: string): Promise<MediaDetails.MinAlbum[]>;
    /** Get tracks with no albums, tracks in albums with a single track, and tracks in albums not by this artist. */
    getSingles(id: string): Promise<MediaDetails.MinTrack[]>;
  }
}

export interface Adapter<
  TArtistConnector extends Connector.Artist = Connector.Artist,
> {
  artist: TArtistConnector;
}
