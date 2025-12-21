import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";

export function Switch({ enabled }: { enabled: boolean }) {
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withTiming(enabled ? 20 : 0, { duration: 150 }) },
    ],
  }));
  return (
    <Animated.View
      className={cn("relative h-6 w-11 rounded-full bg-onSurface p-0.5", {
        "bg-red": enabled,
      })}
    >
      <Animated.View
        style={[{ [OnRTL.decide("right", "left")]: 2 }, thumbStyle]}
        className="absolute top-0.5 size-5 rounded-full bg-neutral100"
      />
    </Animated.View>
  );
}
