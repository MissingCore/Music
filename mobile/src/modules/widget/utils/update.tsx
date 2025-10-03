import { requestWidgetUpdate } from "react-native-android-widget";

import type { PlayerWidgetData } from "../types";
import type { WidgetName } from "../constants/Widgets";
import { nameToWidget } from "../constants/Widgets";

/** Have widget render "not found" state which opens the app on click. */
export async function resetWidgets() {
  await updateWidgets({ track: undefined, isPlaying: false });
}

/** Abstract updating all widgets. */
export async function updateWidgets({
  exclude,
  ...args
}: PlayerWidgetData & { exclude?: WidgetName[] }) {
  const updatedWidgets = (Object.keys(nameToWidget) as WidgetName[]).filter(
    (name) => (exclude ? !exclude.includes(name) : true),
  );

  return Promise.allSettled(
    updatedWidgets.map((name) =>
      requestWidgetUpdate({
        widgetName: name,
        renderWidget: (props) => {
          const Widget = nameToWidget[name];
          return <Widget {...props} {...args} />;
        },
      }),
    ),
  );
}
