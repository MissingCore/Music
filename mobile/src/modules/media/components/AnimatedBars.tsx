import { memo } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";

import { useInForeground } from "~/stores/AppState";
import { usePlaybackStore } from "~/stores/Playback/store";

export function PlayingIndicator() {
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  return <AnimatedBars active={isPlaying} />;
}

export const AnimatedBars = memo(function AnimatedBars({
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
});

const DURATION = 500;

const AnimatedBar = memo(function AnimatedBar(props: {
  height: number;
  width: number;
  startingPercent: number;
  active: boolean;
}) {
  const inForeground = useInForeground();
  return (
    <Animated.View
      style={{
        width: props.width,
        animationName: {
          from: { height: 0 },
          to: { height: props.height },
        },
        animationDuration: DURATION,
        // A negative `animationDelay` causes the animation to start in the
        // position `animationDelay` into the animation.
        animationDelay: -props.startingPercent * DURATION,
        animationTimingFunction: "ease-in-out",
        animationDirection: "alternate",
        animationIterationCount: "infinite",
        animationPlayState: props.active && inForeground ? "running" : "paused",
      }}
      className="bg-primary"
    />
  );
});
