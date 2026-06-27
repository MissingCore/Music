// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useAtomValue, useSetAtom } from "jotai";
import { useMemo } from "react";
import { I18nManager, View } from "react-native";

import { PlaybackControls } from "~/stores/Playback/actions";
import { usePreferenceStore } from "~/stores/Preference/store";

import { Waveform, useWaveformSamples } from "./Waveform";
import {
  animatedPositionAtom,
  isSeekingAtom,
  renderedPositionAtom,
} from "../helpers/Seekbar.context";

import { OnRTL } from "~/lib/react";
import { clamp, formatSeconds } from "~/utils/number";
import { CachedSlider } from "~/components/Form/Slider";
import { Em } from "~/components/Typography/StyledText";

interface SeekBarProps {
  id: string;
  uri: string;
  trackLength: number;
}

export function SeekBar(props: SeekBarProps) {
  const waveformSlider = usePreferenceStore((s) => s.waveformSlider);
  const samples = useWaveformSamples(props.id, props.uri);
  const timedPosition = useAtomValue(animatedPositionAtom);
  const setIsSeeking = useSetAtom(isSeekingAtom);
  const renderedPos = useAtomValue(renderedPositionAtom);

  const sharedSliderOptions = useMemo(
    () => ({
      initValue: 0,
      liveValue: timedPosition,
      min: 0,
      max: props.trackLength,
      getInteractionStatus: setIsSeeking,
      onComplete: PlaybackControls.seekTo,
      inverted: I18nManager.isRTL,
    }),
    [timedPosition, setIsSeeking, props.trackLength],
  );

  const clampedPos = clamp(0, renderedPos, props.trackLength);

  return (
    <View>
      {waveformSlider ? (
        <View className="relative mb-2 h-10">
          <Waveform
            amplitudes={samples}
            height={40}
            progress={clampedPos}
            maxProgress={props.trackLength}
          />
          <CachedSlider
            {...sharedSliderOptions}
            thickness={40}
            transparent
            _className="absolute top-0 left-0 w-full"
          />
        </View>
      ) : (
        <CachedSlider
          {...sharedSliderOptions}
          hitSlop={8}
          trackColor="surfaceContainerHigh"
          roundedEndStop
        />
      )}
      <View
        style={{ flexDirection: OnRTL.decide("row-reverse", "row") }}
        className="justify-between"
      >
        <Em>{formatSeconds(clampedPos)}</Em>
        <Em>{formatSeconds(props.trackLength)}</Em>
      </View>
    </View>
  );
}
