import AudioBrowser from "react-native-audio-browser";

import { SegmentedList } from "~/components/List/Segmented";
import { PlaybackParameterSlider } from "./PlaybackParameterSlider";

export function PlaybackParameterSettings() {
  return (
    <SegmentedList>
      <PlaybackParameterSlider
        field="pitch"
        onUpdate={AudioBrowser.setPitch}
        icon="voice-selection"
      />
      <PlaybackParameterSlider
        field="speed"
        onUpdate={AudioBrowser.setRate}
        icon="slow-motion-video"
      />
    </SegmentedList>
  );
}
