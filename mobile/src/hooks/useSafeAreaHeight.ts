// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Returns height of screen excluding system decoration (status & navigation bar). */
export function useSafeAreaHeight() {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  //? As of React Native 0.86, height returned by `useWindowDimensions()`,
  //? `Dimensions.get("window")`, and `Dimensions.get("screen")` will be
  //? the same.
  //?  - https://github.com/react/react-native/pull/53254
  //?
  //? This is a breaking change for Android APIs older than 35 due to the "height"
  //? including the system decoration (status & navigation bar heights).
  //?  - https://github.com/facebook/react-native/issues/47080#issuecomment-2421914957
  return screenHeight - insets.top - insets.bottom;
}
