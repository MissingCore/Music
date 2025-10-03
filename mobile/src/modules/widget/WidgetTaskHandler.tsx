import type { WidgetTaskHandlerProps } from "react-native-android-widget";

import { MusicControls } from "~/modules/media/services/Playback";

import { bgWait } from "~/utils/promise";
import { WidgetAction } from "./constants";
import { getWidgetData } from "./utils";
import { updateWidgets } from "./utils/update";
import { ArtworkPlayerWidget } from "./ArtworkPlayerWidget";
import { NowPlayingWidget } from "./NowPlayingWidget";

const nameToWidget = {
  ArtworkPlayer: ArtworkPlayerWidget,
  NowPlaying: NowPlayingWidget,
};

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
      renderWidget(<Widget {...widgetData} />);
      break;

    case "WIDGET_DELETED":
      // Do nothing
      break;

    case "WIDGET_CLICK":
      if (clickAction === WidgetAction.PlayPause) {
        widgetData.isPlaying = !widgetData.isPlaying;
        updateWidgets({
          track: widgetData.track,
          isPlaying: widgetData.isPlaying,
        });
        await MusicControls.playToggle();

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
        if (clickAction === WidgetAction.Prev) await MusicControls.prev();
        else if (clickAction === WidgetAction.Next) await MusicControls.next();
        await updateWidgets(getWidgetData());
      }
      break;

    default:
      break;
  }
}
