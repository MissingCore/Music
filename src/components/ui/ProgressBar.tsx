import { View } from "react-native";
import Animated from "react-native-reanimated";

import { cn } from "@/lib/style";

type ProgressEntry = { color: string; percent: number };

type ProgressBarProps = {
  entries: ProgressEntry[];
  className?: string;
};

/** @description Progress bar that can display several progresses. */
export function ProgressBar({ entries, className }: ProgressBarProps) {
  return (
    <View
      className={cn(
        "h-3 flex-1 flex-row gap-[2px] overflow-hidden rounded-full",
        className,
      )}
    >
      {entries.map(({ color, percent }, idx) => (
        <Animated.View
          key={idx}
          style={{ width: `${percent * 100}%`, backgroundColor: color }}
          className="h-3"
        />
      ))}
    </View>
  );
}
