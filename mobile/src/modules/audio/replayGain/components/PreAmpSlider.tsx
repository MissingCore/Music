import { memo } from "react";
import { View } from "react-native";

import { usePlaybackStore } from "~/stores/Playback/store";
import * as ReplayGain from "../core/actions";
import { DB_OFFSET } from "../core/constants";

import { CachedSlider } from "~/components/Form/Slider";
import { Em, TEm } from "~/components/Typography/StyledText";

export const PreAmpSlider = memo(function PreAmpSlider(props: {
  field: "preAmpWTags" | "preAmpWOTags";
  disabled: boolean;
}) {
  const preAmpValue = usePlaybackStore((s) => s[props.field]);
  return (
    <View className="gap-2">
      <TEm
        textKey={`feat.replayGain.extra.${props.field === "preAmpWTags" ? "adjustWithTags" : "adjustWithoutTags"}`}
      />
      <View className="flex-row items-center gap-2">
        <CachedSlider
          initValue={preAmpValue}
          min={DB_OFFSET.min}
          max={DB_OFFSET.max}
          step={0.1}
          onChange={
            props.field === "preAmpWTags"
              ? ReplayGain.updatePreAmpWithTags
              : ReplayGain.updatePreAmpWithoutTags
          }
          disabled={props.disabled}
          hitSlop={10}
          anchorAt={0}
          trackColor="surfaceContainer"
          roundedEndStop
          _debounceMultiplier={0}
          _className="shrink grow"
        />

        <Em
          style={{ fontVariant: ["tabular-nums"] }}
          className="w-14 text-center"
        >
          {preAmpValue >= 0 ? "+" : ""}
          {preAmpValue.toFixed(1)} dB
        </Em>
      </View>
    </View>
  );
});
