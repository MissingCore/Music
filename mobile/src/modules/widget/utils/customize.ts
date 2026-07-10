// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { WidgetInfo } from "react-native-android-widget";

import { Action, withAction } from "../constants/Action";
import type {
  PlayerWidgetData,
  WidgetConfig,
  WidgetConfigColors,
  WidgetDefinition,
} from "../types";

export function getWidgetConfigKey(args: WidgetInfo) {
  return `WIDGET_${args.widgetName}_${args.widgetId}`;
}

export function isWidgetConfigSupported(widgetConfigKey: string) {
  return !widgetConfigKey.startsWith("WIDGET_ArtworkPlayer");
}

export function applyColor(
  config: WidgetConfig,
  color: WidgetConfigColors,
  overrideIsTransparent = false,
) {
  const isTransparent = overrideIsTransparent || config.transparent;
  //? Can't pass `transparent` to `backgroundColor`, so use hex color.
  return isTransparent ? "#00000000" : config[color];
}

/** Applies specified color over background. */
export function applyTextColor(
  config: WidgetConfig,
  color: WidgetConfigColors,
  overrideIsTransparent = false,
) {
  const isTransparent = overrideIsTransparent || config.transparent;
  return isTransparent ? config.textColor : config[color];
}

export type MediaActionKey = "playToggle" | "prev" | "next";

/** Factory function to help determine action, colors, and icon used for media control. */
export function getMediaActionConfigFactory(
  args: WidgetDefinition<PlayerWidgetData>,
) {
  const openApp = args.openApp || args.track === undefined;
  const getColor = (clr: WidgetConfigColors) => applyColor(args.config, clr);
  const getTextColor = (clr: WidgetConfigColors) =>
    applyTextColor(args.config, clr);

  return (key: MediaActionKey) => {
    if (key === "playToggle") {
      return {
        action: withAction(Action.PlayPause, openApp),
        color: {
          bg: getColor(args.isPlaying ? "inactiveColor" : "activeColor"),
          onBg: getTextColor(
            args.isPlaying ? "onInactiveColor" : "onActiveColor",
          ),
        },
        icon: args.isPlaying ? "pause" : "play",
      };
    }
    return {
      action: withAction(key === "prev" ? Action.Prev : Action.Next, openApp),
      color: {
        bg: getColor("bgColor"),
        onBg: getTextColor("textColor"),
      },
      icon: key,
    };
  };
}
