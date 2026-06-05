import { View } from "react-native";
import AudioBrowser from "react-native-audio-browser";
import type { SharedValue } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";

import { SlowMotionVideo } from "~/resources/icons/SlowMotionVideo";
import { sessionStore, useSessionStore } from "~/stores/Session/store";

import { Button } from "~/components/Form/Button";
import { CachedSlider } from "~/components/Form/Slider";
import { SegmentedList } from "~/components/List/Segmented";
import { Em, TStyledText } from "~/components/Typography/StyledText";

export function PlaybackSpeedSetting() {
  const playbackSpeed = useSessionStore((s) => s.playbackSpeed);
  const cachedPlaybackSpeed = useSharedValue(playbackSpeed);

  return (
    <SegmentedList.CustomItem className="gap-4 p-4">
      <TStyledText textKey="feat.playback.extra.speed" className="text-sm" />
      <CachedSlider
        initValue={playbackSpeed}
        liveValue={cachedPlaybackSpeed}
        {...PlaybackSpeedSliderOptions}
      />
      <View className="flex-row items-center gap-4">
        <PlaybackSpeedPreset preset={1} value={cachedPlaybackSpeed} />
        <PlaybackSpeedPreset preset={1.25} value={cachedPlaybackSpeed} />
        <PlaybackSpeedPreset preset={1.5} value={cachedPlaybackSpeed} />
        <PlaybackSpeedPreset preset={2} value={cachedPlaybackSpeed} />
      </View>
    </SegmentedList.CustomItem>
  );
}

//#region Preset Button
function PlaybackSpeedPreset(props: {
  preset: number;
  value: SharedValue<number>;
}) {
  return (
    <Button
      onPress={() => {
        setPlaybackSpeed(props.preset);
        props.value.set(props.preset);
      }}
      className="min-h-8 flex-1 rounded-full bg-surfaceContainerLow py-2 active:bg-surfaceContainer"
    >
      <Em>{formatValue(props.preset)}</Em>
    </Button>
  );
}
//#endregion

//#region Helpers
function setPlaybackSpeed(playbackSpeed: number) {
  sessionStore.setState({ playbackSpeed });
  AudioBrowser.setRate(playbackSpeed);
}

const rateFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

function formatValue(val: number) {
  return `${rateFormatter.format(val)}x`;
}

const PlaybackSpeedSliderOptions = {
  min: 0.25,
  max: 2,
  step: 0.05,
  thickness: 48,
  onChange: setPlaybackSpeed,
  trackColor: "surfaceContainer",
  overlay: {
    accessibilityLabelKey: "feat.playback.extra.speed" as const,
    Icon: SlowMotionVideo,
    formatValue,
  },
} as const;
//#endregion
