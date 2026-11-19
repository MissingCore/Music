// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { AnimatedScrollViewProps } from "react-native-reanimated";
import Animated from "react-native-reanimated";

export function ScrollView(props: AnimatedScrollViewProps) {
  return (
    <Animated.ScrollView
      removeClippedSubviews
      overScrollMode="never"
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      {...props}
    />
  );
}
