import type { WidgetTaskHandlerProps } from "react-native-android-widget";

import { MusicControls } from "~/modules/media/services/Playback";

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
    case "WIDGET_RESIZED":
    case "WIDGET_UPDATE":
      // Have widget open app to prevent things breaking due to the Music
      // store requiring a RNTP service active (or else the data will
      // get cleared).
      renderWidget(<Widget {...widgetData} openApp />);
      break;

    case "WIDGET_DELETED":
      // Do nothing
      break;

    case "WIDGET_CLICK":
      if (clickAction === Action.PlayPause) {
        widgetData.isPlaying = !widgetData.isPlaying;
        updateWidgets({
          track: widgetData.track,
          isPlaying: widgetData.isPlaying,
          exclude: ["ArtworkPlayer"],
        });
        MusicControls.playToggle();

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
        if (clickAction === Action.Prev) await MusicControls.prev();
        else if (clickAction === Action.Next) await MusicControls.next();
        await updateWidgets(getWidgetData());
      }
      break;

    default:
      break;
  }
}
