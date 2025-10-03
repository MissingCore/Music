import { requestWidgetUpdate } from "react-native-android-widget";

import type { PlayerWidgetData } from "../types";
import { ArtworkPlayerWidget } from "../ArtworkPlayerWidget";
import { NowPlayingWidget } from "../NowPlayingWidget";

/** Have widget render "not found" state which opens the app on click. */
export async function resetWidgets() {
  await updateWidgets({ track: undefined, isPlaying: false });
}

/** Abstract updating all widgets. */
export async function updateWidgets(args: PlayerWidgetData) {
  return Promise.allSettled([
    requestWidgetUpdate({
      widgetName: "ArtworkPlayer",
      renderWidget: (props) => <ArtworkPlayerWidget {...props} {...args} />,
    }),
    requestWidgetUpdate({
      widgetName: "NowPlaying",
      renderWidget: (props) => <NowPlayingWidget {...props} {...args} />,
    }),
  ]);
}
