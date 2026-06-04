import { ListLayout } from "~/navigation/layouts/ListLayout";

import { ReplayGainSettings } from "./replayGain/components/ReplayGainSettings";

function AudioEffectsView() {
  return (
    <ListLayout>
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
