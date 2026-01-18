import TrackPlayer from "@weights-ai/react-native-track-player";
import { useTranslation } from "react-i18next";

import { SlowMotionVideo } from "~/resources/icons/SlowMotionVideo";
import { VolumeUp } from "~/resources/icons/VolumeUp";
import { sessionStore, useSessionStore } from "~/services/SessionStore";

import { NSlider } from "~/components/Form/Slider";
import { Sheet } from "~/components/Sheet";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { deferInitialRender } from "~/navigation/components/DeferredRender";

/** Enables us to specify how the media is played. */
export const PlaybackOptionsSheet = deferInitialRender(
  function PlaybackOptionsSheet(props: { ref: TrueSheetRef }) {
    const { t } = useTranslation();
    const playbackSpeed = useSessionStore((s) => s.playbackSpeed);
    const volume = useSessionStore((s) => s.volume);

    return (
      <Sheet ref={props.ref} contentContainerClassName="gap-4">
        <NSlider
          label={t("feat.playback.extra.speed")}
          value={playbackSpeed}
          {...PlaybackSpeedSliderOptions}
        />
        <NSlider
          label={t("feat.playback.extra.volume")}
          value={volume}
          {...VolumeSliderOptions}
        />
      </Sheet>
    );
  },
);

const rateFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

const PlaybackSpeedSliderOptions = {
  min: 0.25,
  max: 2,
  step: 0.05,
  trackMarks: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
  icon: <SlowMotionVideo />,
  onChange: async (playbackSpeed: number) => {
    sessionStore.setState({ playbackSpeed });
    await TrackPlayer.setRate(playbackSpeed).catch();
  },
  formatValue: (playbackSpeed: number) =>
    `${rateFormatter.format(playbackSpeed)}x`,
};

const VolumeSliderOptions = {
  min: 0,
  max: 1,
  step: 0.01,
  trackMarks: [0, 0.25, 0.5, 0.75, 1],
  icon: <VolumeUp />,
  onChange: async (volume: number) => {
    sessionStore.setState({ volume });
    await TrackPlayer.setVolume(volume).catch();
  },
  formatValue: (volume: number) => `${Math.round(volume * 100)}%`,
};
