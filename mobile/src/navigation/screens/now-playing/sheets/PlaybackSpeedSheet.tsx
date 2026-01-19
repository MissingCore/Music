import TrackPlayer from "@weights-ai/react-native-track-player";
import { useState } from "react";
import { View } from "react-native";

import { SlowMotionVideo } from "~/resources/icons/SlowMotionVideo";
import { sessionStore, useSessionStore } from "~/services/SessionStore";

import { Button } from "~/components/Form/Button";
import { CachedSlider } from "~/components/Form/ReanimatedSlider";
import { DetachedSheet } from "~/components/Sheet/Detached";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { StyledText } from "~/components/Typography/StyledText";

export function PlaybackSpeedSheet(props: { ref: TrueSheetRef }) {
  const [canDrag, setCanDrag] = useState(true);
  const playbackSpeed = useSessionStore((s) => s.playbackSpeed);

  return (
    <DetachedSheet ref={props.ref} draggable={canDrag}>
      <CachedSlider
        initVal={playbackSpeed}
        dragPrevention={setCanDrag}
        {...PlaybackSpeedSliderOptions}
      />
      <View className="flex-row items-center gap-4">
        <PlaybackSpeedPreset preset={1} />
        <PlaybackSpeedPreset preset={1.25} />
        <PlaybackSpeedPreset preset={1.5} />
        <PlaybackSpeedPreset preset={2} />
      </View>
    </DetachedSheet>
  );
}

//#region Preset Button
function PlaybackSpeedPreset({ preset }: { preset: number }) {
  return (
    <Button
      onPress={() => setPlaybackSpeed(preset)}
      className="min-h-8 flex-1 rounded-full py-2"
    >
      <StyledText bold className="text-xs">
        {formatValue(preset)}
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
