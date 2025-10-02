import { requestWidgetUpdate } from "react-native-android-widget";

import { sessionStore } from "~/services/SessionStore";

import type { PlayerWidgetData } from "../types";
import { ArtworkPlayerWidget } from "../ArtworkPlayerWidget";

/** Have widget render "not found" state which opens the app on click. */
export async function resetArtworkPlayerWidget() {
  const emptyState = { track: undefined, isPlaying: false };
  sessionStore.setState({ latestWidgetData: emptyState });
  await updateArtworkPlayerWidget(emptyState);
}

/** Abstract updating the artwork player widget. */
export async function updateArtworkPlayerWidget(args: PlayerWidgetData) {
  return requestWidgetUpdate({
    widgetName: "ArtworkPlayer",
    renderWidget: (props) => <ArtworkPlayerWidget {...props} {...args} />,
  });
}
