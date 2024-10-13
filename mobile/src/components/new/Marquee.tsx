import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { cn } from "@/lib/style";

/** Used to progressively display long content. */
export function Marquee({
  children,
  center = false,
  wrapperClassName,
}: {
  children: React.ReactNode;
  center?: boolean;
  /**
   * Styles the `<View />` wrapping the `<Animated.ScrollView />` containing
   * the scrollable content.
   */
  wrapperClassName?: string;
}) {
  const offset = useSharedValue(0);
  const [containerWidth, setContainerWidth] = useState(-1);
  const [contentWidth, setContentWidth] = useState(-1);

  useEffect(() => {
    if (containerWidth === -1 || contentWidth === -1) return;
    // Make sure we reset whenever the children changes size.
    offset.value = 0;
    if (contentWidth <= containerWidth) return;

    const scrollRoom = contentWidth - containerWidth;
    // Make sure we translate `24px` a second.
    const totalDuration = (scrollRoom / 24) * 1000;

    // Only attempt marquee animation if the content is wide enough.
    offset.value = withRepeat(
      withSequence(
        withDelay(
          4000,
          withTiming(scrollRoom, {
            duration: totalDuration,
            easing: Easing.linear,
          }),
        ),
        withDelay(4000, withTiming(0, { duration: 0, easing: Easing.linear })),
      ),
      -1,
    );
  }, [containerWidth, contentWidth, offset]);

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateX: -offset.value }],
  }));

  return (
    <View className={wrapperClassName}>
      <Animated.ScrollView
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        horizontal
        pointerEvents="none"
        showsHorizontalScrollIndicator={false}
        contentContainerClassName={cn("grow overflow-hidden", {
          "justify-center": center,
        })}
      >
        <Animated.View
          onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}
          style={animatedStyles}
        >
          {children}
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}
