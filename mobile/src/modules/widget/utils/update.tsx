// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { requestWidgetUpdate } from "react-native-android-widget";

import { getWidgetConfig, getWidgetConfigKey } from "./customize.core";
import type { WidgetName } from "../impl";
import { nameToWidget } from "../impl";
import type { PlayerWidgetData } from "../types";

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
        renderWidget: async (widgetInfo) => {
          const Widget = nameToWidget[name];
          const configStyle = await getWidgetConfig(
            getWidgetConfigKey(widgetInfo),
          );
          return <Widget {...widgetInfo} config={configStyle} {...args} />;
        },
      }),
    ),
  );
}
