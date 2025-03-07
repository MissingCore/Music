import { useTranslation } from "react-i18next";
import TrackPlayer from "react-native-track-player";

import { SlowMotionVideo } from "~/icons/SlowMotionVideo";
import { VolumeUp } from "~/icons/VolumeUp";
import {
  sessionPreferencesStore,
  useSessionPreferencesStore,
} from "~/services/SessionPreferences";

import { NSlider } from "~/components/Form/Slider";
import { Sheet } from "~/components/Sheet";

/** Sheet allowing us to change how the media is played. */
export default function PlaybackOptionsSheet() {
  const { t } = useTranslation();
  const playbackSpeed = useSessionPreferencesStore(
    (state) => state.playbackSpeed,
  );
  const volume = useSessionPreferencesStore((state) => state.volume);

  return (
    <Sheet id="PlaybackOptionsSheet" contentContainerClassName="gap-4">
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
}

//#region Slider Options
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
    sessionPreferencesStore.setState({ playbackSpeed });
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
    sessionPreferencesStore.setState({ volume });
    await TrackPlayer.setVolume(volume).catch();
  },
  formatValue: (volume: number) => `${Math.round(volume * 100)}%`,
};
//#endregion
