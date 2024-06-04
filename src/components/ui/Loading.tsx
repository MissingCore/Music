import { useEffect, useState } from "react";
import Animated, {
  Easing,
  interpolateColor,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Svg, Circle } from "react-native-svg";

import { Colors } from "@/constants/Styles";

/** @description Nothing loading animation. */
export function Loading() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % 3);
    }, 250);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <Svg width={80} height={20} viewBox="0 0 96 20" className="mx-auto">
      <Circle
        cx="10"
        cy="10"
        r="10"
        fill={
          activeIdx === 0
            ? Colors.surface50
            : activeIdx === 1
              ? Colors.surface400
              : Colors.surface700
        }
      />
      <Circle
        cx="40"
        cy="10"
        r="10"
        fill={activeIdx === 1 ? Colors.surface50 : Colors.surface400}
      />
      <Circle
        cx="70"
        cy="10"
        r="10"
        fill={activeIdx === 2 ? Colors.surface50 : Colors.surface700}
      />
    </Svg>
  );
}

/**
 * @description Loading animation for inside a `<Text />` — animated 3
 *  consecutive periods.
 */
export function LoadingTextEllipsis({
  color,
  durationMs: duration = 2500,
}: {
  color: `#${string}`;
  durationMs?: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const pulse = withTiming(1, { duration, easing: Easing.linear });
    progress.value = withRepeat(pulse, -1, false);
  }, [duration, progress]);

  // Note: We need to stagger the max opacity, otherwise, we'll get some
  // layout shifts where the 3 periods will combine into an ellipsis.
  const colorOpacity1 = useDerivedValue(() =>
    interpolateColor(
      progress.value,
      [0, 0.24, 0.25, 1],
      [`${color}00`, `${color}00`, `${color}F2`, `${color}F2`],
    ),
  );
  const colorOpacity2 = useDerivedValue(() =>
    interpolateColor(
      progress.value,
      [0, 0.49, 0.5, 1],
      [`${color}00`, `${color}00`, `${color}F7`, `${color}F7`],
    ),
  );
  const colorOpacity3 = useDerivedValue(() =>
    interpolateColor(
      progress.value,
      [0, 0.74, 0.75, 1],
      [`${color}00`, `${color}00`, `${color}FF`, `${color}FF`],
    ),
  );

  return (
    <>
      <Animated.Text style={{ color: colorOpacity1 }}>.</Animated.Text>
      <Animated.Text style={{ color: colorOpacity2 }}>.</Animated.Text>
      <Animated.Text style={{ color: colorOpacity3 }}>.</Animated.Text>
    </>
  );
}
