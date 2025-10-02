import { requestWidgetUpdate } from "react-native-android-widget";

import type { WidgetBaseProps } from "../types";
import { MusicPlayerWidget } from "../MusicPlayerWidget";

/** Have widget render "not found" state which opens the app on click. */
export async function resetMusicPlayerWidget() {
  await updateMusicPlayerWidget({ track: undefined, isPlaying: false });
}

/** Abstract updating the music player widget. */
export async function updateMusicPlayerWidget(args: WidgetBaseProps) {
  return requestWidgetUpdate({
    widgetName: "MusicPlayer",
    renderWidget: (props) => <MusicPlayerWidget {...props} {...args} />,
  });
}
