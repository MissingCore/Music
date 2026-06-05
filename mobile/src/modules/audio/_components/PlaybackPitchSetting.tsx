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

export function PlaybackPitchSetting() {
  const playbackPitch = useSessionStore((s) => s.playbackPitch);
  const cachedPlaybackPitch = useSharedValue(playbackPitch);

  return (
    <SegmentedList.CustomItem className="gap-4 p-4">
      <TStyledText textKey="feat.playback.extra.pitch" className="text-sm" />
      <CachedSlider
        initValue={playbackPitch}
        liveValue={cachedPlaybackPitch}
        {...PlaybackPitchSliderOptions}
      />
      <View className="flex-row items-center gap-4">
        <PlaybackPitchPreset preset={1} value={cachedPlaybackPitch} />
        <PlaybackPitchPreset preset={1.25} value={cachedPlaybackPitch} />
        <PlaybackPitchPreset preset={1.5} value={cachedPlaybackPitch} />
        <PlaybackPitchPreset preset={2} value={cachedPlaybackPitch} />
      </View>
    </SegmentedList.CustomItem>
  );
}

//#region Preset Button
function PlaybackPitchPreset(props: {
  preset: number;
  value: SharedValue<number>;
}) {
  return (
    <Button
      onPress={() => {
        setPlaybackPitch(props.preset);
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
function setPlaybackPitch(playbackPitch: number) {
  sessionStore.setState({ playbackPitch });
  AudioBrowser.setPitch(playbackPitch);
}

const rateFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

function formatValue(val: number) {
  return `${rateFormatter.format(val)}x`;
}

const PlaybackPitchSliderOptions = {
  min: 0.25,
  max: 2,
  step: 0.05,
  thickness: 48,
  onChange: setPlaybackPitch,
  trackColor: "surfaceContainer",
  overlay: {
    accessibilityLabelKey: "feat.playback.extra.pitch" as const,
    Icon: SlowMotionVideo,
    formatValue,
  },
} as const;
//#endregion
