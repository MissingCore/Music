import { View } from "react-native";

import type { Icon } from "~/resources/icons/type";

import { CachedSlider } from "~/components/Form/Slider";
import { Em } from "~/components/Typography/StyledText";

interface Props extends Omit<
  React.ComponentProps<typeof CachedSlider>,
  "_className"
> {
  displayedValue: string;
  /** Optional icon that appears before the `displayedValue`. */
  Icon?: (props: Icon) => React.JSX.Element;
}

export function AudioEffectSlider({ displayedValue, Icon, ...props }: Props) {
  return (
    <View className="flex-row items-center gap-2">
      <CachedSlider
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
  );
}
