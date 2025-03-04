import { Slider as RNSlider } from "@miblanchard/react-native-slider";
import { useState } from "react";
import { Pressable, View } from "react-native";
import TrackPlayer from "react-native-track-player";

import { SlowMotionVideo } from "~/icons/SlowMotionVideo";
import { VolumeUp } from "~/icons/VolumeUp";
import {
  sessionPreferencesStore,
  useSessionPreferencesStore,
} from "~/services/SessionPreferences";
import { useTheme } from "~/hooks/useTheme";

import { Colors } from "~/constants/Styles";
import { cn } from "~/lib/style";
import { Sheet } from "~/components/Sheet";
import { StyledText } from "~/components/Typography/StyledText";

/** Sheet allowing us to change how the media is played. */
export default function PlaybackOptionsSheet() {
  const playbackSpeed = useSessionPreferencesStore(
    (state) => state.playbackSpeed,
  );
  const volume = useSessionPreferencesStore((state) => state.volume);

  return (
    <Sheet id="PlaybackOptionsSheet" contentContainerClassName="gap-4">
      <Slider
        value={playbackSpeed}
        min={0.25}
        max={2}
        trackMarks={PlaybackSpeedMarks}
        icon={<SlowMotionVideo />}
        onChange={setPlaybackSpeed}
        formatValue={formatPlaybackSpeed}
      />
      <Slider
        value={volume}
        min={0}
        max={1}
        trackMarks={VolumeMarks}
        icon={<VolumeUp />}
        onChange={setVolume}
        formatValue={formatVolume}
      />
    </Sheet>
  );
}

//#region Slider
/** Custom slider design to match the one in the Nothing X app. */
function Slider(
  props: MarkProps & {
    icon: React.ReactNode;
    formatValue: (value: number) => string;
  },
) {
  const { surface } = useTheme();
  const [width, setWidth] = useState<number>();

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      className="relative overflow-hidden rounded-full"
    >
      <RNSlider
        value={props.value}
        minimumValue={props.min}
        maximumValue={props.max}
        onValueChange={async ([newPos]) => await props.onChange(newPos!)}
        minimumTrackTintColor={`${Colors.red}33`} // 20% Opacity
        maximumTrackTintColor={surface}
        thumbStyle={{
          height: 64,
          width: props.value === props.min || props.value === props.max ? 0 : 2,
          backgroundColor: Colors.red,
        }}
        trackStyle={{ height: 64 }}
        // The slider height defaults to 40px and isn't inferred from the heights assigned.
        containerStyle={{ height: 64 }}
      />
      {width !== undefined ? <SliderMarks width={width} {...props} /> : null}
      <View
        pointerEvents="none"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex-row items-center gap-2"
      >
        {props.icon}
        <StyledText className="min-w-12 text-sm" bold>
          {props.formatValue(props.value)}
        </StyledText>
      </View>
    </View>
  );
}

type MarkProps = {
  value: number;
  min: number;
  max: number;
  trackMarks?: number[];
  onChange: (value: number) => void | Promise<void>;
};

/** Makes the marks clickable. */
function SliderMarks(props: MarkProps & { width: number }) {
  if (!props.trackMarks) return null;
  return props.trackMarks.map((val) => (
    <Pressable
      key={val}
      accessible={false}
      hitSlop={{ left: 7, right: 7, top: 24, bottom: 24 }}
      onPress={() => props.onChange(val)}
      disabled={props.value === val}
      pointerEvents={props.value === val ? "none" : "auto"}
      style={{
        left: ((val - props.min) / (props.max - props.min)) * props.width,
      }}
      className={cn(
        "absolute top-1/2 h-4 w-0.5 -translate-x-px -translate-y-1/2",
        { "bg-foreground/5": val !== props.min && val !== props.max },
      )}
    />
  ));
}
//#endregion

//#region Playback Speed Context
const rateFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

const PlaybackSpeedMarks = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const setPlaybackSpeed = async (newRate: number) => {
  sessionPreferencesStore.setState({ playbackSpeed: newRate });
  try {
    await TrackPlayer.setRate(newRate);
  } catch {}
};
const formatPlaybackSpeed = (rate: number) => `${rateFormatter.format(rate)}x`;
//#endregion

//#region Volume Context
const VolumeMarks = [0, 0.25, 0.5, 0.75, 1];

const setVolume = async (newVolume: number) => {
  sessionPreferencesStore.setState({ volume: newVolume });
  try {
    await TrackPlayer.setVolume(newVolume);
  } catch {}
};
const formatVolume = (volume: number) => `${Math.round(volume * 100)}%`;
//#endregion
