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

import { OnRTLWorklet } from "~/lib/react";
import { cn } from "~/lib/style";

/** Used to progressively display long content. */
export function Marquee({
  color,
  ...props
}: {
  children: React.ReactNode;
  /** Color of the container this `<Marquee />` will be on. Defaults to `canvas`. */
  color?: Exclude<keyof ReturnType<typeof useTheme>, "theme">;
  center?: boolean;
  /**
   * Styles the `<View />` wrapping the `<Animated.ScrollView />` containing
   * the scrollable content.
   */
  wrapperClassName?: string;
  /** Styles the `<View />` wrapping `children`. */
  contentContainerClassName?: string;
}) {
  const themeColors = useTheme();
  const shadowColor = useMemo(
    () => themeColors[color ?? "canvas"],
    [themeColors, color],
  );
  // This will enable support of hexadecimal colors with opacity.
  const startColor = useMemo(() => `${shadowColor}00`, [shadowColor]);
  const endColor = useMemo(() => `${shadowColor}E6`, [shadowColor]);

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
    transform: [{ translateX: OnRTLWorklet.flipSign(-offset.value) }],
  }));

  // Styles to determine when to render the scroll shadow.
  const isLeftVisible = useAnimatedStyle(() => ({
    display:
      offset.value === OnRTLWorklet.decide(contentWidth - containerWidth, 0)
        ? "none"
        : "flex",
    [OnRTLWorklet.decide("right", "left")]: 0,
  }));
  const isRightVisible = useAnimatedStyle(() => ({
    display:
      !isStatic &&
      offset.value !== OnRTLWorklet.decide(0, contentWidth - containerWidth)
        ? "flex"
        : "none",
    [OnRTLWorklet.decide("left", "right")]: 0,
  }));

  return (
    <View
      className={cn("relative shrink overflow-hidden", props.wrapperClassName)}
    >
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
          className={cn(
            "flex-row items-center gap-2",
            props.contentContainerClassName,
          )}
        >
          {props.children}
        </Animated.View>
      </Animated.ScrollView>
      {/* Scroll Shadow */}
      <Animated.View
        pointerEvents="none"
        style={isLeftVisible}
        className={cn("absolute h-full", { hidden: isStatic })}
      >
        <LinearGradient colors={[endColor, startColor]} {...ShadowProps} />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={isRightVisible}
        className={cn("absolute h-full", { hidden: isStatic })}
      >
        <LinearGradient colors={[startColor, endColor]} {...ShadowProps} />
      </Animated.View>
    </View>
  );
}

const ShadowProps = {
  start: { x: 0.0, y: 1.0 },
  end: { x: 1.0, y: 1.0 },
  className: "h-full w-4",
};
