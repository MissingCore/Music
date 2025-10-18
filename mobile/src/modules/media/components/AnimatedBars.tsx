import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { usePlaybackStore } from "~/stores/Playback/store";

import { withPause } from "~/utils/animation/pause";

export function PlayingIndicator() {
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  return <AnimatedBars active={isPlaying} />;
}

export function AnimatedBars({
  size = 24,
  padding = 12,
  active = false,
}: {
  size?: number;
  padding?: number;
  active?: boolean;
}) {
  const dimension = size + padding * 2;
  const gapArea = size / 6;
  const barWidth = (size - gapArea) / 3;

  const sharedProps = { height: size, width: barWidth, active };

  return (
    <View
      style={{ height: dimension, width: dimension, padding, gap: gapArea / 2 }}
      className="flex-row items-end"
    >
      <AnimatedBar {...sharedProps} startingPercent={0.1} />
      <AnimatedBar {...sharedProps} startingPercent={0.5} />
      <AnimatedBar {...sharedProps} startingPercent={1} />
    </View>
  );
}

const DURATION = 500;

function AnimatedBar(props: {
  height: number;
  width: number;
  startingPercent: number;
  active: boolean;
}) {
  const animatedHeight = useSharedValue(props.startingPercent * props.height);
  const paused = useSharedValue(false);

  useEffect(() => {
    // `setTimeout` required to fix issue where mounting with `active = false`
    // wouldn't show the initial state.
    const timeout = setTimeout(() => {
      paused.value = !props.active;
    }, 1);
    return () => clearTimeout(timeout);
  }, [props.active, paused]);

  useEffect(() => {
    animatedHeight.value = withPause(
      withDelay(
        DURATION - DURATION * (animatedHeight.value / props.height),
        withRepeat(
          withSequence(
            withTiming(props.height, { duration: DURATION }),
            withTiming(0, { duration: DURATION }),
          ),
          -1,
          true,
        ),
      ),
      paused,
    );
  }, [props.height, props.startingPercent, animatedHeight, paused]);

  const animatedStyles = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    width: props.width,
  }));

  return <Animated.View style={animatedStyles} className="bg-red" />;
}
