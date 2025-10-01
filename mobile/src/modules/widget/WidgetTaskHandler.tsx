import type { WidgetTaskHandlerProps } from "react-native-android-widget";

import { MusicControls } from "~/modules/media/services/Playback";

import { bgWait } from "~/utils/promise";
import { getMusicWidgetData } from "./utils";
import { MusicPlayerWidget } from "./MusicPlayerWidget";

const nameToWidget = {
  MusicPlayer: MusicPlayerWidget,
};

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;
  const Widget =
    nameToWidget[widgetInfo.widgetName as keyof typeof nameToWidget];

  const musicContextData = await getMusicWidgetData();
  const widgetData = { ...widgetInfo, ...musicContextData };

  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_RESIZED":
    case "WIDGET_UPDATE":
      props.renderWidget(<Widget {...widgetData} />);
      break;

    case "WIDGET_DELETED":
      // Do nothing
      break;

    case "WIDGET_CLICK":
      if (props.clickAction === "PLAY_PAUSE") {
        MusicControls.playToggle();
        widgetData.isPlaying = !widgetData.isPlaying;
        // Briefly indicate that we switched "states" in the widget.
        for (let i = 0; i < 2; i++) {
          props.renderWidget(<Widget {...widgetData} overlayState={i} />);
          await bgWait(i === 0 ? 500 : 0);
        }
        props.renderWidget(<Widget {...widgetData} />);
      }
      break;

    default:
      break;
  }
}
