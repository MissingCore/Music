import Animated, {
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { TouchLong } from "~/resources/icons/TouchLong";
import { useUserPreferencesStore } from "~/services/UserPreferences";

import { Colors } from "~/constants/Styles";

/** A breathing "long-press" indicator. */
export function LongPressIndicator() {
  const showVisualTips = useUserPreferencesStore((state) => state.visualTips);

  const animatedOpacity = useAnimatedStyle(() => ({
    opacity: withRepeat(
      withSequence(
        withDelay(5000, withTiming(1, { duration: 1500 })),
        withDelay(2500, withTiming(0, { duration: 1500 })),
      ),
      -1,
      false,
    ),
  }));

  if (!showVisualTips) return null;
  return (
    <Animated.View
      style={animatedOpacity}
      className="absolute right-1 top-1 rounded-full bg-neutral0/75 p-1"
    >
      <TouchLong size={16} color={Colors.neutral100} />
    </Animated.View>
  );
}
