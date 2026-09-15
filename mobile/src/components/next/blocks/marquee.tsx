// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useInForeground } from "~/stores/ListenerState";

import { OnRTLWorklet } from "~/lib/react";
import { cn } from "~/lib/style";
import { ScrollView } from "~/components/Base/ScrollView";

interface MarqueeProps {
  children: React.ReactNode;
  /** Applies to the outer most `<View />`. */
  wrapperClassName?: string;
  /** Applies to the `<View />` wrapping `children`. */
  contentContainerClassName?: string;
}

export function Marquee(props: MarqueeProps) {
  const { width: recalculateLayout } = useWindowDimensions();
  const inForeground = useInForeground();
  const containerWidth = useSharedValue(-1);
  const contentWidth = useSharedValue(-1);

  const translationOffset = useDerivedValue(() => {
    if (
      // Run animation when sizing is known.
      containerWidth.get() === -1 ||
      contentWidth.get() === -1 ||
      // Skip animations if it's unnecessary.
      contentWidth.get() <= containerWidth.get() ||
      // Don't run animations when app is in background to prevent slight
      // freeze on return to foreground.
      !inForeground
    ) {
      return 0;
    }

    const translatableArea = contentWidth.get() - containerWidth.get();
    const animOpts = {
      // Move at 24px per second.
      duration: (translatableArea / 24) * 1000,
      easing: Easing.linear,
    };

    return withSequence(
      //? Ensure the animation gets reset before applying any changes.
      withSpring(0),
      withRepeat(
        withSequence(
          withDelay(3000, withTiming(translatableArea, animOpts)),
          withDelay(3000, withTiming(0, animOpts)),
        ),
        -1,
      ),
    );
  });

  const contentWrapperStyles = useAnimatedStyle(() => ({
    transform: [
      { translateX: OnRTLWorklet.flipSign(-translationOffset.get()) },
    ],
  }));

  return (
    <Animated.View
      //? Key is required to fix issue where `onLayout` doesn't get re-called
      //? after the first screen rotation (so it gets called at most 2 times).
      key={String(recalculateLayout)}
      pointerEvents="none"
      className={cn("shrink grow", props.wrapperClassName)}
    >
      <ScrollView
        onLayout={(e) => containerWidth.set(e.nativeEvent.layout.width)}
        horizontal
      >
        <Animated.View
          onLayout={(e) => contentWidth.set(e.nativeEvent.layout.width)}
          style={contentWrapperStyles}
          className={props.contentContainerClassName}
        >
          {props.children}
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
}
