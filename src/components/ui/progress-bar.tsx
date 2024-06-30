import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { cn } from "@/lib/style";
import { partitionArray } from "@/utils/object";

/** @description Animated progress bar that can display several progresses. */
export function ProgressBar(props: {
  entries: Array<{ color: string; value: number }>;
  total: number;
  className?: string;
}) {
  const [barWidth, setBarWidth] = useState(0);

  const [usedEntries, unUsedEntries] = partitionArray(
    props.entries,
    ({ value }) => (value / props.total) * barWidth >= 1,
  );

  const newTotal =
    props.total - unUsedEntries.reduce((prev, curr) => prev + curr.value, 0);

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
        props.className,
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

/** @description Segment of progress bar that gets animated. */
function ProgressSegment(props: {
  color: string;
  width: number;
  first?: boolean;
  last?: boolean;
}) {
  const segmentWidth = useSharedValue(props.first ? 0 : 2);
  const animatedWidth = useAnimatedStyle(() => ({ width: segmentWidth.value }));

  useEffect(() => {
    segmentWidth.value = withTiming(props.width, { duration: 500 });
  }, [segmentWidth, props.width]);

  return (
    <Animated.View
      style={[{ backgroundColor: props.color }, animatedWidth]}
      className={cn("h-3", {
        "ml-0.5": !props.first,
        "rounded-r-full": props.last,
      })}
    />
  );
}
