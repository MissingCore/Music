import { View } from "react-native";

import { usePlaybackStore } from "~/stores/Playback/store";
import * as ReplayGain from "../core/actions";

import { cn } from "~/lib/style";
import { Divider } from "~/components/Divider";
import { CachedSlider } from "~/components/Form/Slider";
import { SegmentedList } from "~/components/List/Segmented";
import { Em, TEm, TStyledText } from "~/components/Typography/StyledText";
import { Switch } from "~/components/UI/Switch";

export function ReplayGainSettings() {
  const isReplayGainEnabled = usePlaybackStore((s) => s.isReplayGainEnabled);

  return (
    <SegmentedList>
      <SegmentedList.Item
        labelTextKey="feat.replayGain.title"
        onPress={ReplayGain.toggleStatus}
        RightElement={<Switch enabled={isReplayGainEnabled} />}
      />
      <SegmentedList.CustomItem className="p-4">
        <View
          needsOffscreenAlphaCompositing
          className={cn("gap-4", { "opacity-25": !isReplayGainEnabled })}
        >
          <View className="gap-0.5">
            <TStyledText
              textKey="feat.replayGain.extra.preAmp"
              className="text-sm"
            />
            <TStyledText
              textKey="feat.replayGain.extra.preAmpDescription"
              dim
            />
          </View>
          <Divider />
          <PreAmpSlider variant="preAmpWTags" disabled={!isReplayGainEnabled} />
          <PreAmpSlider
            variant="preAmpWOTags"
            disabled={!isReplayGainEnabled}
          />
        </View>
      </SegmentedList.CustomItem>
    </SegmentedList>
  );
}

function PreAmpSlider(props: {
  variant: "preAmpWTags" | "preAmpWOTags";
  disabled: boolean;
}) {
  const preAmpValue = usePlaybackStore((s) => s[props.variant]);

  return (
    <View className="gap-2">
      <TEm
        textKey={`feat.replayGain.extra.${props.variant === "preAmpWTags" ? "adjustWithTags" : "adjustWithoutTags"}`}
      />
      <View className="flex-row items-center gap-2">
        <CachedSlider
          initValue={preAmpValue}
          min={-15}
          max={15}
          step={0.1}
          onChange={
            props.variant === "preAmpWTags"
              ? ReplayGain.updatePreAmpWithTags
              : ReplayGain.updatePreAmpWithoutTags
          }
          disabled={props.disabled}
          hitSlop={10}
          anchorAt={0}
          trackColor="surfaceContainerLow"
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
}
