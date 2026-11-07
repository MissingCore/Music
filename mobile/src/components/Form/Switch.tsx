// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { cn } from "~/lib/style";

export function Switch({ enabled }: { enabled: boolean }) {
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withTiming(enabled ? 20 : 0, { duration: 150 }) },
    ],
  }));
  return (
    <Animated.View
      className={cn(
        "relative h-6 w-11 rounded-full bg-surfaceContainerHigh p-0.5",
        { "bg-primary": enabled },
      )}
    >
      <Animated.View
        style={thumbStyle}
        className="absolute top-0.5 size-5 rounded-full bg-onPrimary ltr:left-0.5 rtl:right-0.5"
      />
    </Animated.View>
  );
}
