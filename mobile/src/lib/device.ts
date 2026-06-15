import { Platform } from "react-native";

/**
 * Returns the SDK version code.
 *
 * @see https://developer.android.com/reference/android/os/Build.VERSION_CODES
 */
export function getAPIVersionCode() {
  return Number(Platform.Version);
}
