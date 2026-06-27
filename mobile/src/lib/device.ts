// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { Platform } from "react-native";

/**
 * Returns the SDK version code.
 *
 * @see https://developer.android.com/reference/android/os/Build.VERSION_CODES
 */
export function getAPIVersionCode() {
  return Number(Platform.Version);
}
