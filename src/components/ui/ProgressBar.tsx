import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { cn } from "@/lib/style";
import { partitionArray } from "@/utils/object";

type ProgressEntry = { color: string; value: number };

type ProgressBarProps = {
  entries: ProgressEntry[];
  total: number;
  className?: string;
};

/** @description An animated progress bar that can display several progresses. */
export function ProgressBar({ entries, total, className }: ProgressBarProps) {
  const [barWidth, setBarWidth] = useState(0);

  const [usedEntries, unUsedEntries] = partitionArray(
    entries,
    ({ value }) => (value / total) * barWidth >= 1,
  );

  const newTotal =
    total - unUsedEntries.reduce((prev, curr) => prev + curr.value, 0);

  const newEntries = usedEntries.map(({ color, value }, idx) => {
    const percent = value / newTotal;
    let width = percent * (barWidth - 2 * (usedEntries.length - 1));
    if (idx !== 0) width += 2;
    return { color, width };
  });

  return (
    <View
      onLayout={({ nativeEvent }) => setBarWidth(nativeEvent.layout.width)}
      className={cn(
        "h-3 flex-1 flex-row overflow-hidden rounded-full",
        className,
      )}
    >
      {newEntries.map((entry, idx) => (
        <ProgressSegment
          key={idx}
          {...entry}
          first={idx === 0}
          last={idx === newEntries.length - 1}
        />
      ))}
    </View>
  );
}

type ProgressSegmentProps = {
  color: string;
  width: number;
  first?: boolean;
  last?: boolean;
};

/** @description Segment of progress bar that gets animated. */
function ProgressSegment({ color, width, first, last }: ProgressSegmentProps) {
  const segmentWidth = useSharedValue(first ? 0 : 2);
  const animatedWidth = useAnimatedStyle(() => ({ width: segmentWidth.value }));

  useEffect(() => {
    segmentWidth.value = withTiming(width, { duration: 500 });
  }, [segmentWidth, width]);

  return (
    <Animated.View
      style={[{ backgroundColor: color }, animatedWidth]}
      className={cn("h-3", { "ml-0.5": !first, "rounded-r-full": last })}
    />
  );
}
