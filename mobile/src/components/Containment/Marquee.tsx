import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";

import { useTheme } from "~/hooks/useTheme";

import { cn } from "~/lib/style";

/** Used to progressively display long content. */
export function Marquee({
  color,
  topOffset = 0,
  ...props
}: {
  children: React.ReactNode;
  /**
   * Color of the container this `<Marquee />` will be on. Defaults to
   * `canvasAlt` color in `useTheme()` since this is mostly used in the sheets.
   */
  color?: string;
  /** Offset to apply to scroll shadow if top padding is applied. */
  topOffset?: number;
  center?: boolean;
  /**
   * Styles the `<View />` wrapping the `<Animated.ScrollView />` containing
   * the scrollable content.
   */
  wrapperClassName?: string;
}) {
  const { canvasAlt } = useTheme();
  const shadowColor = useMemo(() => color ?? canvasAlt, [color, canvasAlt]);

  const offset = useSharedValue(0);
  const [containerWidth, setContainerWidth] = useState(-1);
  const [contentWidth, setContentWidth] = useState(-1);

  // If the marquee doesn't need to be animated.
  const isStatic = contentWidth <= containerWidth;

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
          3000,
          withTiming(scrollRoom, {
            duration: totalDuration,
            easing: Easing.linear,
          }),
        ),
        withDelay(
          3000,
          withTiming(0, { duration: totalDuration, easing: Easing.linear }),
        ),
      ),
      -1,
    );
  }, [containerWidth, contentWidth, offset]);

  const contentStyles = useAnimatedStyle(() => ({
    transform: [{ translateX: -offset.value }],
  }));

  // Styles to determine when to render the scroll shadow.
  const isLeftVisible = useAnimatedStyle(() => ({
    display: offset.value === 0 ? "none" : "flex",
    top: topOffset,
  }));
  const isRightVisible = useAnimatedStyle(() => ({
    display:
      !isStatic && offset.value < contentWidth - containerWidth
        ? "flex"
        : "none",
    top: topOffset,
  }));

  return (
    <View className={cn("relative", props.wrapperClassName)}>
      <Animated.ScrollView
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        horizontal
        pointerEvents="none"
        showsHorizontalScrollIndicator={false}
        contentContainerClassName={cn("grow items-center overflow-hidden", {
          "justify-center": props.center,
        })}
      >
        <Animated.View
          onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}
          style={contentStyles}
        >
          {props.children}
        </Animated.View>
      </Animated.ScrollView>
      {/* Scroll Shadow */}
      <Animated.View
        pointerEvents="none"
        style={isLeftVisible}
        className={cn("absolute left-0 h-full", { hidden: isStatic })}
      >
        <LinearGradient
          colors={[`${shadowColor}E6`, `${shadowColor}00`]}
          {...ShadowProps}
        />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={isRightVisible}
        className={cn("absolute right-0 h-full", { hidden: isStatic })}
      >
        <LinearGradient
          colors={[`${shadowColor}00`, `${shadowColor}E6`]}
          {...ShadowProps}
        />
      </Animated.View>
    </View>
  );
}

const ShadowProps = {
  start: { x: 0.0, y: 1.0 },
  end: { x: 1.0, y: 1.0 },
  className: "h-full w-4",
};
