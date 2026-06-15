import NativeUtils from "../NativeUtils";
import type { AssetResult, AssetsOptions } from "./types";

/** Return assets that Android identifies as audio files. */
export async function getAudioAssets(
  options: AssetsOptions,
): Promise<AssetResult> {
  if (!NativeUtils.getAudioAssets) {
    throw new Error("`getAudioAssets` is not available.");
  }
  return NativeUtils.getAudioAssets(options);
}
