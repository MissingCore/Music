import { NativeModule, requireNativeModule } from "expo";

export type MusicAsset = {
  id: string;
  uri: string;
  filename: string | null;
  title: string | null;
  album: string | null;
  artist: string | null;
  albumArtist: string | null;
  genre: string | null;
  duration: number | null;
  fileSize: number | null;
  mimeType: string | null;
  bitrate: number | null;
  discNumber: number | null;
  trackNumber: number | null;
  year: number | null;
  mediaType: "audio";
  creationTime: number | null;
  modificationTime: number | null;
};

declare class NativeUtilsModule extends NativeModule {
  isSystemDarkMode: boolean;
  launchAppViaIntent(): void;
  saveBundledAssetToURI(assetName: string, toUri: string): Promise<void>;
  getMusicAssets(page: number, pageSize: number): Promise<MusicAsset[]>;
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
  page: number,
  pageSize: number,
): Promise<MusicAsset[]> {
  return nativeModule.getMusicAssets(page, pageSize);
}
