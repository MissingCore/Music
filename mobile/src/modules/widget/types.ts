export type WidgetTrack = {
  title: string;
  artist: string | null;
  artwork: string | null;
};

export type WidgetBaseProps = {
  track: WidgetTrack | undefined;
  isPlaying: boolean;
  // progress: `${string}%`;
};
