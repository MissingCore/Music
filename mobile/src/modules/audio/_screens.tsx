import type { StaticScreenProps } from "@react-navigation/native";

import { playbackStore, usePlaybackStore } from "~/stores/Playback/store";

import { ListLayout } from "~/navigation/layouts/ListLayout";

import { SegmentedList } from "~/components/List/Segmented";
import { Switch } from "~/components/UI/Switch";
import { PlaybackParameterSettings } from "./_components/PlaybackParameterSettings";
import { EqualizerSettings } from "./equalizer/components/EqualizerSettings";
import { ReplayGainSettings } from "./replayGain/components/ReplayGainSettings";

type Props = StaticScreenProps<{ showHidden?: boolean }>;

function AudioEffectsView({
  route: {
    params: { showHidden },
  },
}: Props) {
  const restoreVolume = usePlaybackStore((s) => s.restoreVolume);
  return (
    <ListLayout>
      <EqualizerSettings />
      {showHidden ? <PlaybackParameterSettings /> : null}
      <ReplayGainSettings />
      <SegmentedList.Item
        labelTextKey="feat.playback.extra.restoreVolume"
        onPress={toggleRestoreVolume}
        RightElement={<Switch enabled={restoreVolume} />}
      />
    </ListLayout>
  );
}

//#region Helpers
function toggleRestoreVolume() {
  playbackStore.setState((prev) => ({ restoreVolume: !prev.restoreVolume }));
}
//#endregion

const AudioEffectScreenGroup = {
  screenOptions: {
    animation: "fade",
  },
  screens: {
    AudioEffects: {
      screen: AudioEffectsView,
      options: { title: "feat.audioEffects.title" },
    },
  },
} as const;

export default AudioEffectScreenGroup;
