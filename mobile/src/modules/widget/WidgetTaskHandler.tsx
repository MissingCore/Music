import type { WidgetTaskHandlerProps } from "react-native-android-widget";

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
      break;

    default:
      break;
  }
}
