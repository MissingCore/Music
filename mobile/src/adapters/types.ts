import type { Protocol } from "./constants";

import type { Maybe, ObjectValues } from "~/utils/types";

export type AdapterProtocol = ObjectValues<typeof Protocol>;

export namespace MediaLibrary {
  type SchemaBase = {
    id: string;
    /** Helps identify which adapter should be used to consume the item. */
    protocol: AdapterProtocol;
    name: string;
    artworkSrc: Maybe<string>;
  };

  type ListBase = { duration: number; trackCount: number };

  /** Minimal representation of a relation to another data structure. */
  type SimpleRelation = { id: string; name: string };

  /** Basic representation of an album. */
  export interface Album extends SchemaBase, ListBase {
    /** Album artists in a "display" format. */
    artist: string;
    artists: SimpleRelation[];
  }

  /** `Album` with relations. */
  export interface Album2 extends Album {
    tracks: Array<
      Track & { disc: Maybe<number>; track: Maybe<number>; year: Maybe<number> }
    >;
  }

  /** Basic representation of an artist. */
  export interface Artist extends SchemaBase, ListBase {}

  /** `Artist` with relations. */
  export interface Artist2 extends Artist {
    albums: Array<Album & { year: Maybe<string> }>;
    tracks: Track[];
  }

  /** Basic representation of a folder. */
  export interface Folder extends SchemaBase {
    subDirs: string[];
    tracks: Track[];
  }

  /** Basic representation of a genre. */
  export interface Genre extends SchemaBase, ListBase {}

  /** `Genre` with relations. */
  export interface Genre2 extends Genre {
    tracks: Track[];
  }

  /** Basic representation of a playlist. */
  export interface Playlist extends SchemaBase, ListBase {}

  /** `Playlist` with relations. */
  export interface Playlist2 extends Playlist {
    tracks: Track[];
  }

  /** Shared representation of a track. */
  export interface Track extends SchemaBase {
    /** Points to the playable media. */
    src: string;
    /** Track length in seconds. Tracks without a valid `duration` will be filtered out. */
    duration: number;

    /** Artist in a "display" format. */
    artist: Maybe<string>;
    /** Guaranteed at least 1 result if returned as an array. */
    artists: Maybe<SimpleRelation[]>;

    album: Maybe<string>;
    albumId: Maybe<string>;

    discoverTime: Maybe<number>;
    modificationTime: Maybe<number>;

    /** Identifies the folder this track is in. */
    parent: Maybe<string>;
  }

  /** Representation of additional data associated with a track. */
  export interface TrackStat {
    trackId: string;
    protocol: AdapterProtocol;

    /** The mimetype of the file. */
    contentType: Maybe<string>;
    bitrate: Maybe<number>;
    sampleRate: Maybe<number>;
    size: Maybe<number>;
  }
}
