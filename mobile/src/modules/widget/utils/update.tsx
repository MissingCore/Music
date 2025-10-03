import { requestWidgetUpdate } from "react-native-android-widget";

import { sessionStore } from "~/services/SessionStore";

import type { PlayerWidgetData } from "../types";
import { ArtworkPlayerWidget } from "../ArtworkPlayerWidget";
import { NowPlayingWidget } from "../NowPlayingWidget";

/** Have widget render "not found" state which opens the app on click. */
export async function resetWidgets() {
  const emptyState = { track: undefined, isPlaying: false };
  sessionStore.setState({ latestWidgetData: emptyState });
  await updateWidgets(emptyState);
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
