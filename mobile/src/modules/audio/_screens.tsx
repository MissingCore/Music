// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";

import { ScrollLayout } from "~/navigation/layouts/ScrollLayout";

import { PlaybackParameterSettings } from "./_components/PlaybackParameterSettings";
import { VolumeSettings } from "./_components/VolumeSettings";
import { EqualizerSettings } from "./equalizer/components/EqualizerSettings";
import { ReplayGainSettings } from "./replayGain/components/ReplayGainSettings";

type Props = StaticScreenProps<{ showHidden?: boolean }>;

function AudioEffectsView({
  route: {
    params: { showHidden },
  },
}: Props) {
  return (
    <ScrollLayout title="feat.audioEffects.title">
      <EqualizerSettings />
      {showHidden ? <PlaybackParameterSettings /> : null}
      <ReplayGainSettings />
      <VolumeSettings />
    </ScrollLayout>
  );
}

const AudioEffectScreenGroup = {
  screenOptions: { animation: "fade" },
  screens: {
    AudioEffects: { screen: AudioEffectsView },
  },
} as const;

export default AudioEffectScreenGroup;
