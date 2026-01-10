import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import type { Icon } from "~/resources/icons/type";

import { cn } from "~/lib/style";
import { Button } from "./Button";
import { StyledText } from "../Typography/StyledText";

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
          selectedIndex * (pickerWidth.value / options.length),
          { duration: 250 },
        ),
      },
    ],
  }));

  return (
    <View className="gap-2">
      <View className="rounded-full bg-surfaceContainerLowest p-1">
        <View
          onLayout={(e) => {
            pickerWidth.value = e.nativeEvent.layout.width;
          }}
          className="relative flex-row items-start justify-center"
        >
          <Animated.View
            style={selectedIndicatorStyle}
            className="absolute top-0 left-0 h-full rounded-full bg-foreground"
          />
          {options.map(({ Icon }, idx) => (
            <Button
              key={idx}
              onPress={() => onOptionSelected(idx)}
              className="flex-1 rounded-full bg-transparent p-0"
            >
              <Icon
                size={20}
                color={selectedIndex === idx ? "inverseOnSurface" : undefined}
              />
            </Button>
          ))}
        </View>
      </View>
      <View className="flex-row items-start justify-center">
        {options.map(({ label }, idx) => (
          <StyledText
            key={idx}
            dim
            bold={selectedIndex === idx}
            className={cn("flex-1 px-2 text-center", {
              "text-foreground": selectedIndex === idx,
            })}
          >
            {label.toLocaleUpperCase()}
          </StyledText>
        ))}
      </View>
    </View>
  );
}
