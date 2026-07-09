import type { WidgetInfo } from "react-native-android-widget";

export function getWidgetConfigKey(args: WidgetInfo) {
  return `WIDGET_${args.widgetName}_${args.widgetId}`;
}

export function isWidgetConfigSupported(widgetConfigKey: string) {
  return !widgetConfigKey.startsWith("WIDGET_ArtworkPlayer");
}
