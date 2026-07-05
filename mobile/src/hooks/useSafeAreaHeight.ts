// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getAPIVersionCode } from "~/lib/device";

/** Returns height of screen excluding system decoration (status & navigation bar). */
export function useSafeAreaHeight() {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  // In Android API 35+, the "height" now includes the system decoration
  // areas and display cutout (status & navigation bar heights).
  //  - https://github.com/facebook/react-native/issues/47080#issuecomment-2421914957
  if (getAPIVersionCode() < 35) return screenHeight;
  return screenHeight - insets.top - insets.bottom;
}
