import { NativeModule, requireNativeModule } from "expo";

declare class NativeUtilsModule extends NativeModule {
  isSystemDarkMode: boolean;
  launchAppViaIntent(): void;
  saveBundledAssetToURI(assetName: string, toUri: string): Promise<void>;
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
