import type { ParseKeys } from "i18next";
import { View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";

import type { Icon } from "~/resources/icons/type";

import { CachedSlider } from "~/components/Form/Slider";
import { SegmentedList } from "~/components/List/Segmented";
import { Em, TStyledText } from "~/components/Typography/StyledText";

interface Props extends Omit<
  React.ComponentProps<typeof CachedSlider>,
  "initValue" | "liveValue" | "_className"
> {
  labelKey: ParseKeys;
  value: number;

  displayedValue: string;
  /** Optional icon that appears before the `displayedValue`. */
  Icon?: (props: Icon) => React.JSX.Element;

  /** Content we can render under the slider. */
  ExtraContent?: (props: {
    liveValue: SharedValue<number>;
  }) => React.JSX.Element;
}

export function AudioEffectSlider({
  labelKey,
  value,
  displayedValue,
  Icon,
  ExtraContent,
  ...props
}: Props) {
  const cachedValue = useSharedValue(value);
  return (
    <SegmentedList.CustomItem className="gap-4 p-4">
      <TStyledText textKey={labelKey} className="text-sm" />
      <View className="flex-row items-center gap-2">
        <CachedSlider
          initValue={value}
          liveValue={cachedValue}
          hitSlop={10}
          trackColor="surfaceContainer"
          roundedEndStop
          _debounceMultiplier={1}
          _className="shrink grow"
          {...props}
        />
        <View className="w-14 flex-row items-center justify-center gap-2">
          {Icon ? <Icon size={20} /> : null}
          <Em style={{ fontVariant: ["tabular-nums"] }}>{displayedValue}</Em>
        </View>
      </View>
      {ExtraContent ? <ExtraContent liveValue={cachedValue} /> : null}
    </SegmentedList.CustomItem>
  );
}
