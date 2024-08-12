import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Svg, Circle } from "react-native-svg";

import { Colors } from "@/constants/Styles";

/** Nothing loading animation. */
export function LoadingIndicator() {
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

/** Loading animation of animated 3 consecutive periods. */
export function AnimatedTextEllipsis({
  color,
  durationMs: duration = 2500,
  textClass,
}: {
  color: `#${string}`;
  durationMs?: number;
  textClass?: string;
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

  const dot1Style = useAnimatedStyle(() => ({ color: colorOpacity1.value }));
  const dot2Style = useAnimatedStyle(() => ({ color: colorOpacity2.value }));
  const dot3Style = useAnimatedStyle(() => ({ color: colorOpacity3.value }));

  return (
    <View className="flex-row">
      <Animated.Text style={dot1Style} className={textClass}>
        .
      </Animated.Text>
      <Animated.Text style={dot2Style} className={textClass}>
        .
      </Animated.Text>
      <Animated.Text style={dot3Style} className={textClass}>
        .
      </Animated.Text>
    </View>
  );
}
