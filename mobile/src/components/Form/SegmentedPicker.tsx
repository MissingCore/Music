import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import type { Icon } from "~/resources/icons/type";

import { OnRTLWorklet } from "~/lib/react";
import { cn } from "~/lib/style";
import { Pressable } from "../Base/Pressable";
import { Em } from "../Typography/StyledText";

export type PickerOption = {
  Icon: (props: Icon) => React.JSX.Element;
  label: string;
};

/** Custom segmented picker design to match the one in the Nothing X app. */
export function SegmentedPicker({
  options,
  selectedIndex,
  onOptionSelected,
}: {
  options: PickerOption[];
  selectedIndex: number;
  onOptionSelected: (index: number) => void;
}) {
  const pickerWidth = useSharedValue(0);

  const selectedIndicatorStyle = useAnimatedStyle(() => ({
    width: `${(1 / options.length) * 100}%`,
    transform: [
      {
        translateX: withTiming(
          OnRTLWorklet.decide(-selectedIndex, selectedIndex) *
            (pickerWidth.get() / options.length),
          { duration: 250 },
        ),
      },
    ],
  }));

  return (
    <View className="gap-2">
      <View className="rounded-full bg-surfaceContainerLowest p-0.5">
        <View
          onLayout={(e) => pickerWidth.set(e.nativeEvent.layout.width)}
          className="relative flex-row items-start justify-center"
        >
          <Animated.View
            style={selectedIndicatorStyle}
            className="absolute top-0 left-0 h-full rounded-full bg-onSurface"
          />
          {options.map(({ Icon }, idx) => (
            <Pressable
              key={idx}
              onPress={() => onOptionSelected(idx)}
              className="min-h-10 flex-1 items-center justify-center rounded-full active:opacity-50"
            >
              <Icon
                size={20}
                color={selectedIndex === idx ? "inverseOnSurface" : undefined}
              />
            </Pressable>
          ))}
        </View>
      </View>
      <View className="flex-row items-start justify-center">
        {options.map(({ label }, idx) => {
          const active = selectedIndex === idx;
          return (
            <Em
              key={idx}
              bold={active}
              className={cn("flex-1 px-2 text-center", {
                "text-onSurfaceVariant": !active,
              })}
            >
              {label.toLocaleUpperCase()}
            </Em>
          );
        })}
      </View>
    </View>
  );
}
