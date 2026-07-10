// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { WidgetInfo } from "react-native-android-widget";

import type { WidgetConfig, WidgetConfigColors } from "../types";

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
