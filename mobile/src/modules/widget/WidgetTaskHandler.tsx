import type { WidgetTaskHandlerProps } from "react-native-android-widget";
// @ts-expect-error - Function we export by patching the package.
import { openApp } from "react-native-android-widget";

import { PlaybackControls } from "~/stores/Playback/actions";

import { isRNTPSetUp } from "~/lib/react-native-track-player";
import { bgWait } from "~/utils/promise";
import { Action } from "./constants/Action";
import { nameToWidget } from "./constants/Widgets";
import { getWidgetData } from "./utils";
import { updateWidgets } from "./utils/update";

export async function widgetTaskHandler({
  widgetInfo,
  widgetAction,
  clickAction,
  renderWidget,
}: WidgetTaskHandlerProps) {
  const Widget =
    nameToWidget[widgetInfo.widgetName as keyof typeof nameToWidget];
  const widgetData = { ...widgetInfo, ...getWidgetData() };

  switch (widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED":
      // Have widget open app if the RNTP service isn't available to
      // prevent things breaking due to the Playback store requiring a RNTP
      // service active (or else the data will get cleared).
      const shouldOpen = !(await isRNTPSetUp());
      renderWidget(<Widget {...widgetData} openApp={shouldOpen} />);
      break;

    case "WIDGET_DELETED":
      // Do nothing
      break;

    case "WIDGET_CLICK":
      if (!(await isRNTPSetUp())) {
        openApp();
        return;
      }

      if (clickAction === Action.PlayPause) {
        widgetData.isPlaying = !widgetData.isPlaying;
        updateWidgets({
          track: widgetData.track,
          isPlaying: widgetData.isPlaying,
          exclude: ["ArtworkPlayer"],
        });
        PlaybackControls.playToggle({ noRevalidation: true });

        // Run special animation for `ArtworkPlayer` widget.
        if (widgetInfo.widgetName === "ArtworkPlayer") {
          // Briefly indicate that we switched "states" in the widget.
          for (let i = 0; i < 2; i++) {
            renderWidget(<Widget {...widgetData} overlayState={i} />);
            await bgWait(i === 0 ? 500 : 50);
          }
          renderWidget(<Widget {...widgetData} />);
        }
      } else {
        if (clickAction === Action.Prev) await PlaybackControls.prev();
        else if (clickAction === Action.Next) await PlaybackControls.next();
        await updateWidgets(getWidgetData());
      }
      break;

    default:
      break;
  }
}
