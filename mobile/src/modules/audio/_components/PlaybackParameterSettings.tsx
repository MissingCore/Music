import AudioBrowser from "react-native-audio-browser";

import { SlowMotionVideo } from "~/resources/icons/SlowMotionVideo";
import { VoiceSelection } from "~/resources/icons/VoiceSelection";

import { SegmentedList } from "~/components/List/Segmented";
import { PlaybackParameterSlider } from "./PlaybackParameterSlider";

export function PlaybackParameterSettings() {
  return (
    <SegmentedList>
      <PlaybackParameterSlider
        field="pitch"
        onUpdate={AudioBrowser.setPitch}
        Icon={VoiceSelection}
      />
      <PlaybackParameterSlider
        field="speed"
        onUpdate={AudioBrowser.setRate}
        Icon={SlowMotionVideo}
      />
    </SegmentedList>
  );
}
