import { useEffect, useState } from "react";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { LabeledSlider } from "~/components/Form/Slider.variant";

export function OpacitySlider(props: {
  value: string;
  onComplete: (hex: string) => void;
}) {
  const alpha = useSharedValue(1);

  useEffect(() => {
    alpha.set(hexToAlpha(props.value));
  }, [alpha, props.value]);

  const [_alpha, _setAlpha] = useState(1);
  useAnimatedReaction(
    () => alpha.get(),
    (currVal) => scheduleOnRN(_setAlpha, currVal),
  );

  return (
    <LabeledSlider
      {...SliderConfig}
      liveValue={alpha} //? Will override the initial value.
      onComplete={(alpha) => props.onComplete(alphaToHex(alpha))}
      displayedValue={`${Math.round(_alpha * 100)}%`}
    />
  );
}

//#region Helpers
const SliderConfig = {
  initValue: 1,
  min: 0,
  max: 1,
  step: 0.01,
  thickness: 28,
  hitSlop: 0,
};

/** Returns a value between 0 (0x00) & 1 (0xFF), rounded to 2 decimal places. */
function hexToAlpha(hex: string) {
  if (hex.length !== 2) return 1;
  return +(parseInt(hex, 16) / 255).toFixed(2);
}

/** Returns a value between 0x00 (0) & 0xFF (1). */
function alphaToHex(alpha: number) {
  if (alpha < 0 || alpha > 1) return "FF";
  return Math.round(alpha * 255) // Round to prevent hexadecimal fractions
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
}
//#endregion
