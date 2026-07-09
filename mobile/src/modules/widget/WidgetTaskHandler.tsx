// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { launchAppViaIntent } from "@missingcore/native-utils";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";

import { PlaybackControls } from "~/stores/Playback/actions";

import { isAudioBrowserSetUp } from "~/lib/react-native-audio-browser";
import { bgWait } from "~/utils/promise";
import { Action } from "./constants/Action";
import { DEFAULT_WIDGET_CONFIG } from "./constants/Config";
import type { WidgetName } from "./impl";
import { nameToWidget } from "./impl";
import { getWidgetData } from "./utils";
import {
  deleteWidgetConfig,
  getWidgetConfig,
  getWidgetConfigKey,
} from "./utils/customize";
import { updateWidgets } from "./utils/update";

export async function widgetTaskHandler({
  widgetInfo,
  widgetAction,
  clickAction,
  clickActionData,
  renderWidget,
}: WidgetTaskHandlerProps) {
  const Widget = nameToWidget[widgetInfo.widgetName as WidgetName];
  const widgetData = { ...widgetInfo, ...getWidgetData() };

  const widgetKey = getWidgetConfigKey(widgetInfo);

  switch (widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED":
      // Have widget open app if the AudioBrowser service isn't available to
      // prevent things breaking due to the Playback store requiring a AudioBrowser
      // service active (or else the data will get cleared).
      const shouldOpen = !(await isAudioBrowserSetUp());
      const styleConfig = await getWidgetConfig(widgetKey);
      renderWidget(
        <Widget {...widgetData} config={styleConfig} openApp={shouldOpen} />,
      );
      break;

    case "WIDGET_DELETED":
      // Delete stored widget instance config.
      deleteWidgetConfig(widgetKey);
      break;

    case "WIDGET_CLICK":
      //! "Hack" to prevent re-firing old widget click events that started
      //! to get re-sent when we swap over to the New Architecture.
      if (((clickActionData?.validUntil as number) ?? 0) - Date.now() < 0) {
        return;
      }

      if (!(await isAudioBrowserSetUp())) return launchAppViaIntent();

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
            renderWidget(
              <Widget
                {...widgetData}
                config={DEFAULT_WIDGET_CONFIG}
                overlayState={i}
              />,
            );
            await bgWait(i === 0 ? 500 : 50);
          }
          renderWidget(
            <Widget {...widgetData} config={DEFAULT_WIDGET_CONFIG} />,
          );
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
