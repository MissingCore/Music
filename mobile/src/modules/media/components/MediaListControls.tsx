import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Pause } from "~/icons/Pause";
import { PlayArrow } from "~/icons/PlayArrow";
import { useMusicStore } from "../services/Music";
import { MusicControls, playFromMediaList } from "../services/Playback";

import { Colors } from "~/constants/Styles";
import { cn } from "~/lib/style";
import { Button } from "~/components/Form/Button";
import { RepeatButton, ShuffleButton } from "./MediaControls";
import { arePlaybackSourceEqual } from "../helpers/data";
import type { PlayListSource } from "../types";

/** Media controls used on media list pages. */
export function MediaListControls(props: {
  trackSource: PlayListSource;
  className?: string;
}) {
  return (
    <View className={cn("flex-row items-center gap-1", props.className)}>
      <RepeatButton large={false} />
      <ShuffleButton large={false} />
      <PlayMediaListButton trackSource={props.trackSource} />
    </View>
  );
}

/**
 * A play/pause button that's linked to whether the provided source is
 * currently playing (ie: show play button if we're not playing a track
 * from this media list).
 */
function PlayMediaListButton({ trackSource }: { trackSource: PlayListSource }) {
  const { t } = useTranslation();
  const currSource = useMusicStore((state) => state.playingSource);
  const isPlaying = useMusicStore((state) => state.isPlaying);

  const isThisSource = arePlaybackSourceEqual(currSource, trackSource);
  const displayPause = isThisSource && isPlaying;

  const Icon = displayPause ? Pause : PlayArrow;

  return (
    <Button
      accessibilityLabel={t(`term.${displayPause ? "pause" : "play"}`)}
      onPress={
        displayPause
          ? MusicControls.pause
          : () => playFromMediaList({ source: trackSource })
      }
      className={cn("min-w-12 bg-red p-3", { "bg-onSurface": displayPause })}
    >
      <Icon color={Colors.neutral100} />
    </Button>
  );
}
