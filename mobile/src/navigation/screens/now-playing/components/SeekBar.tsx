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
import { StyledText } from "~/components/Typography/StyledText";

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
        <View className="relative h-12">
          <Waveform
            amplitudes={samples}
            height={48}
            progress={clampedPos}
            maxProgress={props.trackLength}
          />
          <CachedSlider
            {...sharedSliderOptions}
            height={48}
            transparent
            _className="absolute top-0 left-0 w-full"
          />
        </View>
      ) : (
        <CachedSlider
          {...sharedSliderOptions}
          vHitSlop={8}
          trackColor="surfaceContainerHigh"
          roundedEndStop
        />
      )}
      <View
        style={{ flexDirection: OnRTL.decide("row-reverse", "row") }}
        className="justify-between"
      >
        <StyledText className="text-sm">{formatSeconds(clampedPos)}</StyledText>
        <StyledText className="text-sm">
          {formatSeconds(props.trackLength)}
        </StyledText>
      </View>
    </View>
  );
}
