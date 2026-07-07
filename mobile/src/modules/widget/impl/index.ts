// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { ArtworkPlayerWidget } from "./ArtworkPlayerWidget";
import { NowPlayingWidget } from "./NowPlayingWidget";
import { ResizableNowPlayingWidget } from "./ResizableNowPlayingWidget";
import { SkinnyNowPlayingWidget } from "./SkinnyNowPlayingWidget";

export const nameToWidget = {
  ArtworkPlayer: ArtworkPlayerWidget,
  NowPlaying: NowPlayingWidget,
  ResizableNowPlaying: ResizableNowPlayingWidget,
  SkinnyNowPlaying: SkinnyNowPlayingWidget,
} as const;

export type WidgetName = keyof typeof nameToWidget;
