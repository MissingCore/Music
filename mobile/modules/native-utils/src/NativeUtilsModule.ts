import { NativeModule, requireNativeModule } from "expo";

interface AssetsOptions {
  first: number;
  after?: number;
  fromIds?: string[];
  resolveWithFullInfo?: boolean;
}

export type MusicAsset = {
  id: string;
  filename: string;
  uri: string;
  mimeType: string;
  creationTime: number;
  modificationTime: number;
  duration: number;

  title: string | null;
  album: string | null;
  albumArtist: string | null;
  artist: string | null;
  genre: string | null;
  year: number | null;
  discNumber: number | null;
  trackNumber: number | null;
  bitrate: number | null;
  fileSize: number | null;
};

export type MusicAssetResult = {
  assets: MusicAsset[];
  hasNextPage: boolean;
  endCursor: number;
  totalCount: number;
};

declare class NativeUtilsModule extends NativeModule {
  isSystemDarkMode: boolean;
  launchAppViaIntent(): void;
  saveBundledAssetToURI(assetName: string, toUri: string): Promise<void>;
  getMusicAssets(options: AssetsOptions): Promise<MusicAssetResult>;
}

const nativeModule = requireNativeModule<NativeUtilsModule>("NativeUtils");

export const isSystemDarkMode = nativeModule.isSystemDarkMode;

export function launchAppViaIntent() {
  return nativeModule.launchAppViaIntent();
}

/**
 * Save asset obtained via `require()` to specified URI.
 * - **Note:** Only works in release build.
 */
export async function saveBundledAssetToURI(assetName: string, toUri: string) {
  if (__DEV__) return;
  return nativeModule.saveBundledAssetToURI(assetName, toUri);
}

export async function getMusicAssets(
  options: AssetsOptions,
): Promise<MusicAssetResult> {
  return nativeModule.getMusicAssets(options);
}
