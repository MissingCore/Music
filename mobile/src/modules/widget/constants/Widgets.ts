import { ArtworkPlayerWidget } from "../ArtworkPlayerWidget";
import { NowPlayingWidget } from "../NowPlayingWidget";
import { ResizeableNowPlayingWidget } from "../ResizeableNowPlayingWidget";

export const nameToWidget = {
  ArtworkPlayer: ArtworkPlayerWidget,
  NowPlaying: NowPlayingWidget,
  ResizeableNowPlaying: ResizeableNowPlayingWidget,
} as const;

export type WidgetName = keyof typeof nameToWidget;
