import { useCallback, useEffect, useMemo, useState } from "react";
import { I18nManager, View } from "react-native";
import { Easing, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";

import { usePlaybackStore } from "~/stores/Playback/store";
import { PlaybackControls } from "~/stores/Playback/actions";
import { usePreferenceStore } from "~/stores/Preference/store";
import { useSessionStore } from "~/services/SessionStore";
import { Waveform, useWaveformSamples } from "./Waveform";

import { OnRTL } from "~/lib/react";
import { clamp, formatSeconds } from "~/utils/number";
import { CachedSlider } from "~/components/Form/Slider";
import { StyledText } from "~/components/Typography/StyledText";

interface SeekBarProps {
  id: string;
  uri: string;
  trackLength: number;
}

const LISTENER_ID = 24680;

export function SeekBar(props: SeekBarProps) {
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const lastPosition = usePlaybackStore((s) => s.lastPosition);
  const waveformSlider = usePreferenceStore((s) => s.waveformSlider);
  const samples = useWaveformSamples(props.id, props.uri);
  const playbackSpeed = useSessionStore((s) => s.playbackSpeed);
  const timedPosition = useSharedValue(lastPosition);
  const [isSeeking, setIsSeeking] = useState(false);
  const [renderedPos, setRenderedPos] = useState(lastPosition);

  const animateSlider = useCallback(
    (fromPos: number) => {
      const remainingSeconds = props.trackLength - fromPos;
      const estimatedAnimationDuration =
        (remainingSeconds * 1000) / playbackSpeed;

      timedPosition.value = withTiming(props.trackLength, {
        duration: estimatedAnimationDuration,
        easing: Easing.linear,
      });
    },
    [timedPosition, playbackSpeed, props.trackLength],
  );

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
    [timedPosition, props.trackLength],
  );

  useEffect(() => {
    if (isSeeking) return;
    timedPosition.value = lastPosition;
    if (!isPlaying) return;
    animateSlider(lastPosition);
  }, [animateSlider, timedPosition, isPlaying, isSeeking, lastPosition]);

  useEffect(() => {
    scheduleOnUI(() =>
      timedPosition.addListener(LISTENER_ID, (value) =>
        scheduleOnRN(setRenderedPos, value),
      ),
    );
    return () => {
      scheduleOnUI(() => timedPosition.removeListener(LISTENER_ID));
    };
  }, [timedPosition]);

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
