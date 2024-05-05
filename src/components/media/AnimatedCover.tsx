import { useEffect } from "react";
import { View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  Keyframe,
  cancelAnimation,
  clamp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { Record } from "@/assets/svgs/Record";

import { cn } from "@/lib/style";
import type { ImageSource } from "./MediaImage";
import { MediaImage } from "./MediaImage";
import type { Media } from "./types";

/** @description Keyframe for having the vinyl slide out from the right. */
const SlideOutRight = (imgSize: number, delay: number) =>
  new Keyframe({
    0: { opacity: 0, translateX: 0 },
    1: { opacity: 1, translateX: 0 },
    100: { opacity: 1, translateX: imgSize / 2 },
  })
    .duration(300)
    .delay(delay);

/** @description Keyframe for having the vinyl slide out from the bottom. */
const SlideOutBottom = (imgSize: number, delay: number) =>
  new Keyframe({
    0: { opacity: 0, translateY: 0 },
    1: { opacity: 1, translateY: 0 },
    100: { opacity: 1, translateY: imgSize * 0.45 },
  })
    .duration(300)
    .delay(delay);

/** @description Simple pulling of vinyl out of record animation. */
export function AnimatedCover(props: {
  type?: Media;
  placement?: "right" | "bottom";
  delay?: number;
  shouldSpin?: boolean;
  source: ImageSource;
  className?: string;
}) {
  const rotationProgress = useSharedValue(0);
  const { width, height } = useWindowDimensions();
  const placement = props.placement ?? "right";
  const delay = props.delay ?? 0;
  const type = props.type ?? "track";

  useEffect(() => {
    if (props.shouldSpin) {
      /*
        `rotationProgress.value + 360` is needed as when we "pause" the
        animation (ie: cancel), `rotationProgress.value` becomes the new
        starting point — we always want to rotate 360deg.
      */
      rotationProgress.value = withRepeat(
        withTiming(rotationProgress.value + 360, {
          duration: 7500,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
    } else {
      cancelAnimation(rotationProgress);
    }
  }, [rotationProgress, props.shouldSpin]);

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationProgress.value}deg` }],
  }));

  /*
    Automatically define the appropriate size of the cover based on the
    current screen size.
  */
  const imgSize =
    placement === "right"
      ? clamp(100, (width * 2) / 5, height / 5)
      : clamp(200, (height * 3) / 7, (width * 2) / 3);

  return (
    <View
      style={{ marginBottom: placement === "bottom" ? imgSize * 0.45 : 0 }}
      className={props.className}
    >
      <Animated.View
        entering={
          placement === "right"
            ? SlideOutRight(imgSize, delay)
            : SlideOutBottom(imgSize, delay)
        }
        className="absolute left-0 top-0 opacity-0"
      >
        <Animated.View style={animatedStyles}>
          <Record
            size={imgSize}
            className={cn({ "rotate-45": placement === "right" })}
          />
        </Animated.View>
      </Animated.View>
      <MediaImage
        type={type}
        size={imgSize}
        source={props.source}
        className="rounded border-2 border-foreground50"
      />
    </View>
  );
}
