// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

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

export type WithDimensions<T> = T & { height: number; width: number };
