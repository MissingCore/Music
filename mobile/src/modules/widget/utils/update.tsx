import { requestWidgetUpdate } from "react-native-android-widget";

import { MusicPlayerWidget } from "../MusicPlayerWidget";

export function resetMusicPlayerWidget() {
  requestWidgetUpdate({
    widgetName: "MusicPlayer",
    renderWidget: (props) => (
      <MusicPlayerWidget {...props} track={undefined} isPlaying={false} />
    ),
  });
}
