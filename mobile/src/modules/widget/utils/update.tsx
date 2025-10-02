import { requestWidgetUpdate } from "react-native-android-widget";

import { sessionStore } from "~/services/SessionStore";

import type { WidgetBaseProps } from "../types";
import { MusicPlayerWidget } from "../MusicPlayerWidget";

/** Have widget render "not found" state which opens the app on click. */
export async function resetMusicPlayerWidget() {
  const emptyState = { track: undefined, isPlaying: false };
  sessionStore.setState({ latestWidgetData: emptyState });
  await updateMusicPlayerWidget(emptyState);
}

/** Abstract updating the music player widget. */
export async function updateMusicPlayerWidget(args: WidgetBaseProps) {
  return requestWidgetUpdate({
    widgetName: "MusicPlayer",
    renderWidget: (props) => <MusicPlayerWidget {...props} {...args} />,
  });
}
