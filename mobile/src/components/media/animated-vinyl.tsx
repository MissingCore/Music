import { cssInterop } from "nativewind";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  Keyframe,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Line } from "react-native-svg";

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";
import type { MediaType } from "@/modules/media/types";
import { MediaImage } from "@/modules/media/components";

const WrappedSvg = cssInterop(Svg, { className: "style" });

/** Keyframe for having the vinyl slide out from the right. */
const SlideOutRight = (imgSize: number, delay: number) =>
  new Keyframe({
    0: { opacity: 0, translateX: 0 },
    1: { opacity: 1, translateX: 0 },
    100: { opacity: 1, translateX: imgSize / 2 },
  })
    .duration(300)
    .delay(delay);

/** Keyframe for having the vinyl slide out from the bottom. */
const SlideOutBottom = (imgSize: number, delay: number) =>
  new Keyframe({
    0: { opacity: 0, translateY: 0 },
    1: { opacity: 1, translateY: 0 },
    100: { opacity: 1, translateY: imgSize * 0.45 },
  })
    .duration(300)
    .delay(delay);

/** Simple pulling of vinyl out of sleeve animation. */
export function AnimatedVinyl(props: {
  /** Available width if `placement = "right"`, otherwise available height. */
  availableLength: number;
  type?: Exclude<MediaType, "folder">;
  placement?: "right" | "bottom";
  delay?: number;
  shouldSpin?: boolean;
  source: MediaImage.ImageSource;
  className?: string;
}) {
  const rotationProgress = useSharedValue(0);
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
    Represents 1/3 of `availableLength` — 2/3 is used for the image, 1/3
    is used for the extended vinyl.
  */
  const areaSection = props.availableLength / 3;

  return (
    <View
      style={{ marginBottom: placement === "bottom" ? areaSection : 0 }}
      className={props.className}
    >
      <Animated.View
        entering={
          placement === "right"
            ? SlideOutRight(areaSection * 2, delay)
            : SlideOutBottom(areaSection * 2, delay)
        }
        className="absolute left-0 top-0 opacity-0"
      >
        <Animated.View style={animatedStyles}>
          {/* Custom Record SVG similar to the one shown in the Nothing Recorder app. */}
          <WrappedSvg
            width={areaSection * 2}
            height={areaSection * 2}
            viewBox="0 0 836 836"
            fill="none"
            className={cn({ "rotate-45": placement === "right" })}
          >
            <Circle
              cx="418"
              cy="418"
              r="343.5"
              strokeWidth="8"
              stroke={Colors.foreground50}
            />
            <Circle
              cx="418"
              cy="418"
              r="88"
              strokeWidth="6"
              stroke={Colors.foreground50}
            />
            <Circle cx="418" cy="418" r="22" fill={Colors.foreground50} />
            <Line
              x1="570"
              y1="416.5"
              x2="701"
              y2="416.5"
              strokeWidth="4"
              stroke={Colors.foreground50}
            />
            <Line
              x1="135"
              y1="416.5"
              x2="266"
              y2="416.5"
              strokeWidth="4"
              stroke={Colors.foreground50}
            />
          </WrappedSvg>
        </Animated.View>
      </Animated.View>
      <MediaImage
        type={type}
        size={areaSection * 2}
        source={props.source}
        className="rounded border-2 border-foreground50"
      />
    </View>
  );
}
