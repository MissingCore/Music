import { PermissionsAndroid, Platform } from "react-native";

import NativeUtils from "../NativeUtils";
import { createPermissionRequestHook } from "../permissions/core";

import type { AssetResult, AssetsOptions } from "./types";

/** Return assets that Android identifies as audio files. */
export async function getAudioAssets(
  options: AssetsOptions,
): Promise<AssetResult> {
  if (!NativeUtils.getAudioAssets) {
    throw new Error("`getAudioAssets` is not available.");
  }
  if (options.first <= 0) {
    throw new Error("`first` must be greater than 0.");
  }
  if ((options.after || 0) < 0) {
    throw new Error("`after` must be greater than 0.");
  }

  return NativeUtils.getAudioAssets(options);
}

/** Request permissions required for this media module. */
export const useMediaLibraryPermissions = createPermissionRequestHook(
  Number(Platform.Version) >= 33
    ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO
    : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
);
