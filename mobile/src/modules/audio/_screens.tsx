import { useNavigation } from "@react-navigation/native";

import { Equalizer } from "~/resources/icons/Equalizer";

import { ListLayout } from "~/navigation/layouts/ListLayout";

import { SegmentedList } from "~/components/List/Segmented";
import EqualizerSettings from "./equalizer/screens/View";
import { ReplayGainSettings } from "./replayGain/components/ReplayGainSettings";

function AudioEffectsView() {
  const navigation = useNavigation();
  return (
    <ListLayout>
      <SegmentedList.Item
        labelTextKey="feat.equalizer.title"
        onPress={() => navigation.navigate("EqualizerSettings")}
        LeftElement={<Equalizer />}
        className="gap-4"
      />
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

    EqualizerSettings: {
      screen: EqualizerSettings,
      options: { title: "feat.equalizer.title" },
    },
  },
} as const;

export default AudioEffectScreenGroup;
