export type WidgetTrack = {
  title: string;
  artist: string | null;
  artwork: string | null;
};

export type WidgetBaseProps = {
  track: WidgetTrack | undefined;
  isPlaying: boolean;
  /** Switch the widget's click event to open the app. */
  openApp?: boolean;
};
