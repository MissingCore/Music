import { ListLayout } from "~/navigation/layouts/ListLayout";

import { EqualizerSettings } from "./equalizer/components/EqualizerSettings";
import { ReplayGainSettings } from "./replayGain/components/ReplayGainSettings";

function AudioEffectsView() {
  return (
    <ListLayout>
      <EqualizerSettings />
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
