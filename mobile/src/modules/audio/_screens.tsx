import type { StaticScreenProps } from "@react-navigation/native";

import { ListLayout } from "~/navigation/layouts/ListLayout";

import { PlaybackParameterSettings } from "./_components/PlaybackParameterSettings";
import { EqualizerSettings } from "./equalizer/components/EqualizerSettings";
import { ReplayGainSettings } from "./replayGain/components/ReplayGainSettings";

type Props = StaticScreenProps<{ showHidden?: boolean }>;

function AudioEffectsView({
  route: {
    params: { showHidden },
  },
}: Props) {
  return (
    <ListLayout>
      <EqualizerSettings />
      {showHidden ? <PlaybackParameterSettings /> : null}
      <ReplayGainSettings />
    </ListLayout>
  );
}

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
