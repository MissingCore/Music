import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { cn } from "~/lib/style";

/** Externally controlled switch component (BYO `<Pressable />`). */
export function Switch({ enabled }: { enabled: boolean }) {
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withTiming(enabled ? 20 : 0, { duration: 150 }) },
    ],
  }));
  return (
    <Animated.View
      className={cn("relative h-6 w-[44px] rounded-full bg-onSurface p-0.5", {
        "bg-red": enabled,
      })}
    >
      <Animated.View
        style={thumbStyle}
        className="absolute left-0.5 top-0.5 size-[20px] rounded-full bg-neutral100"
      />
    </Animated.View>
  );
}
