import { useState } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";

import { cn } from "~/lib/style";
import { partitionArray } from "~/utils/object";

/** Animated progress bar that can display several progresses. */
export function ProgressBar(props: {
  entries: Array<{ color: string; value: number }>;
  total: number;
  className?: string;
}) {
  const [width, setWidth] = useState(0);

  const [usedEntries, unusedEntries] = partitionArray(
    props.entries,
    ({ value }) => (value / props.total) * width >= 1,
  );
  const adjustedTotal =
    props.total - unusedEntries.reduce((prev, curr) => prev + curr.value, 0);
  const useableWidth = width - 2 * (usedEntries.length - 2);

  const newEntries = usedEntries.map(({ color, value }, idx) => ({
    color,
    width: (value / adjustedTotal) * useableWidth,
    last: idx === usedEntries.length - 1,
  }));

  return (
    <View
      onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
      className={cn(
        "h-3 flex-row gap-0.5 overflow-hidden rounded-full",
        props.className,
      )}
    >
      {newEntries.map((entry, idx) => (
        <ProgressSegment key={idx} {...entry} />
      ))}
    </View>
  );
}

/** Segment of progress bar that gets animated. */
function ProgressSegment(props: {
  color: string;
  width: number;
  last?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  return (
    <Animated.View
      onLayout={() => setMounted(true)}
      style={{
        backgroundColor: props.color,
        width: !mounted ? 0 : props.width,
        transitionProperty: "width",
        transitionDuration: 300,
      }}
      className={cn("h-3", { "rounded-r-full": props.last })}
    />
  );
}
