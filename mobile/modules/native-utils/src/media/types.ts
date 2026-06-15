export interface AssetsOptions {
  first: number;
  after?: number;
  /** Return results from assets with the following ids. */
  fromIds?: string[];
  /** Whether metadata should also be returned with the query. Only effective on Android 11+. */
  returnWithMetadata?: boolean;
}

export type Asset = {
  id: string;
  filename: string;
  uri: string;
  mimeType: string;
  modificationTime: number;
  duration: number;
  fileSize: number;

  /** Only available on Android 11+. */
  metadata: AudioMetadata | null;
};

export type AudioMetadata = {
  title: string | null;
  album: string | null;
  albumArtist: string | null;
  artist: string | null;
  genre: string | null;
  year: number | null;
  discNumber: number | null;
  trackNumber: number | null;
  bitrate: number | null;

  /** Only available on Android 16+. */
  sampleRate: number | null;
};

export type AssetResult = {
  assets: Asset[];
  hasNextPage: boolean;
  endCursor: number;
  totalCount: number;
};
