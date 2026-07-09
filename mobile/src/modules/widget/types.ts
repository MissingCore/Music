// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { HexColor } from "react-native-android-widget";

type WidgetTrackData = {
  title: string;
  artist: string | null;
  artwork: string | null;
};

export type PlayerWidgetData = {
  track: WidgetTrackData | undefined;
  isPlaying: boolean;
  /** Switch the widget's click event to open the app. */
  openApp?: boolean;
};

export type WidgetDefinition<T> = T & {
  height: number;
  width: number;
  config: WidgetConfig;
};

export interface WidgetConfig {
  transparent: boolean;

  bgColor: HexColor;
  textColor: HexColor;
  mutedTextColor: HexColor;

  activeColor: HexColor;
  onActiveColor: HexColor;
  inactiveColor: HexColor;
  onInactiveColor: HexColor;
}
