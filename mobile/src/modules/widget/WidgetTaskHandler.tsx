import type { WidgetTaskHandlerProps } from "react-native-android-widget";

import { ResizeableMusicWidget } from "./ResizableMusicWidget";

const nameToWidget = {
  ResizeableMusic: ResizeableMusicWidget,
};

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;
  const Widget =
    nameToWidget[widgetInfo.widgetName as keyof typeof nameToWidget];

  switch (props.widgetAction) {
    case "WIDGET_ADDED":
      props.renderWidget(<Widget />);
      break;
    case "WIDGET_UPDATE":
      break;
    case "WIDGET_RESIZED":
      break;
    case "WIDGET_DELETED":
      break;
    case "WIDGET_CLICK":
      break;
    default:
      break;
  }
}
