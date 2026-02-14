import TrackPlayer from "@weights-ai/react-native-track-player";
import { useState } from "react";
import { View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";

import { SlowMotionVideo } from "~/resources/icons/SlowMotionVideo";
import { sessionStore, useSessionStore } from "~/stores/Session/store";

import { Button } from "~/components/Form/Button";
import { CachedSlider } from "~/components/Form/Slider";
import { DetachedSheet } from "~/components/Sheet";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { StyledText } from "~/components/Typography/StyledText";

export function PlaybackSpeedSheet(props: { ref: TrueSheetRef }) {
  const [stopDrag, setStopDrag] = useState(false);
  const playbackSpeed = useSessionStore((s) => s.playbackSpeed);
  const cachedPlaybackSpeed = useSharedValue(playbackSpeed);

  return (
    <DetachedSheet ref={props.ref} draggable={!stopDrag}>
      <CachedSlider
        initValue={playbackSpeed}
        liveValue={cachedPlaybackSpeed}
        getInteractionStatus={setStopDrag}
        {...PlaybackSpeedSliderOptions}
      />
      <View className="flex-row items-center gap-4">
        <PlaybackSpeedPreset preset={1} value={cachedPlaybackSpeed} />
        <PlaybackSpeedPreset preset={1.25} value={cachedPlaybackSpeed} />
        <PlaybackSpeedPreset preset={1.5} value={cachedPlaybackSpeed} />
        <PlaybackSpeedPreset preset={2} value={cachedPlaybackSpeed} />
      </View>
    </DetachedSheet>
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
        props.value.value = props.preset;
      }}
      className="min-h-8 flex-1 rounded-full py-2 active:bg-surfaceContainer"
    >
      <StyledText bold className="text-xs">
        {formatValue(props.preset)}
      </StyledText>
    </Button>
  );
}
//#endregion

//#region Helpers
async function setPlaybackSpeed(playbackSpeed: number) {
  sessionStore.setState({ playbackSpeed });
  await TrackPlayer.setRate(playbackSpeed).catch();
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
  height: 48,
  onChange: setPlaybackSpeed,
  overlay: {
    accessibilityLabelKey: "feat.playback.extra.speed" as const,
    Icon: SlowMotionVideo,
    formatValue,
  },
};
//#endregion
