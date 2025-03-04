import { Slider as RNSlider } from "@miblanchard/react-native-slider";
import { View } from "react-native";
import TrackPlayer from "react-native-track-player";

import { VolumeUp } from "~/icons/VolumeUp";
import {
  sessionPreferencesStore,
  useSessionPreferencesStore,
} from "~/services/SessionPreferences";
import { useTheme } from "~/hooks/useTheme";

import { Colors } from "~/constants/Styles";
import { Sheet } from "~/components/Sheet";
import { StyledText } from "~/components/Typography/StyledText";

/** Sheet allowing us to change how the media is played. */
export default function PlaybackOptionsSheet() {
  const savedVolume = useSessionPreferencesStore((state) => state.volume);

  return (
    <Sheet id="PlaybackOptionsSheet" contentContainerClassName="gap-4">
      <Slider
        value={savedVolume}
        min={0}
        max={1}
        icon={<VolumeUp />}
        onChange={setVolume}
        formatValue={formatVolume}
      />
    </Sheet>
  );
}

//#region Slider
/** Custom slider design to match the one in the Nothing X app. */
function Slider(props: {
  value: number;
  min: number;
  max: number;
  icon: React.ReactNode;
  onChange: (value: number) => void | Promise<void>;
  formatValue: (value: number) => string;
}) {
  const { surface } = useTheme();
  return (
    <View className="relative overflow-hidden rounded-full">
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
//#endregion

//#region Formatters & Setters
const setVolume = async (newVolume: number) => {
  sessionPreferencesStore.setState({ volume: newVolume });
  try {
    await TrackPlayer.setVolume(newVolume);
  } catch {}
};
const formatVolume = (volume: number) => `${Math.round(volume * 100)}%`;
//#endregion
