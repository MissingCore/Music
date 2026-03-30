import { memo, useState } from "react";
import { View } from "react-native";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { useEqualizerStore } from "../core/store";
import { setEQBandLevel } from "../core/actions";

import { CachedSliderVertical } from "~/components/Form/SliderVertical";
import { Em } from "~/components/Typography/StyledText";

type Props = {
  bandIndex: number;
  value: number;
  disabled?: boolean;
};

export const FrequencySlider = memo(function FrequencySlider(props: Props) {
  const minBand = useEqualizerStore((s) => s.minBandLevel);
  const maxBand = useEqualizerStore((s) => s.maxBandLevel);
  const liveBandValue = useSharedValue(props.value);
  const [bandValue, setBandValue] = useState(props.value);

  useAnimatedReaction(
    () => liveBandValue.value,
    (curr) => scheduleOnRN(setBandValue, curr),
  );

  return (
    <View className="items-center gap-2">
      <CachedSliderVertical
        initValue={bandValue}
        liveValue={liveBandValue}
        min={minBand}
        max={maxBand}
        step={100}
        onChange={(newLevel) => setEQBandLevel(props.bandIndex, newLevel)}
        disabled={props.disabled}
        hHitSlop={10}
        anchorAt={0}
        roundedEndStop
        _debounceMultiplier={1}
        _className="h-48"
      />
      <Em style={{ fontVariant: ["tabular-nums"] }}>
        {bandValue > 0 ? "+" : ""}
        {bandValue / 100}
      </Em>
    </View>
  );
});
