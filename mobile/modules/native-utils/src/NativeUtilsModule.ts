import { NativeModule, requireNativeModule } from "expo";

declare class NativeUtilsModule extends NativeModule {
  bundleId: string;
  isSystemDarkMode: boolean;
  launchAppViaIntent(): void;
  saveBundledAssetToURI(assetName: string, toUri: string): Promise<void>;
  getFontName(fontUri: string): Promise<string>;
}

const nativeModule = requireNativeModule<NativeUtilsModule>("NativeUtils");

export const bundleId = nativeModule.bundleId;

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

/** Returns "true" name of a font from a font file. */
export function getFontName(fontUri: string) {
  return nativeModule.getFontName(fontUri);
}
