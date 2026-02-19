import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Pause } from "~/resources/icons/Pause";
import { PlayArrow } from "~/resources/icons/PlayArrow";
import { usePlaybackStore } from "~/stores/Playback/store";
import { PlaybackControls } from "~/stores/Playback/actions";

import { cn } from "~/lib/style";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import type { PlayFromSource } from "~/stores/Playback/types";
import { arePlaybackSourceEqual } from "~/stores/Playback/utils";
import { RepeatButton, ShuffleButton } from "./MediaControls";

/** Media controls used on media list pages. */
export function MediaListControls(props: { trackSource: PlayFromSource }) {
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-surfaceContainerLowest">
      <RepeatButton size="sm" />
      <ShuffleButton size="sm" />
      <PlayMediaListButton trackSource={props.trackSource} />
    </View>
  );
}

/**
 * A play/pause button that's linked to whether the provided source is
 * currently playing (ie: show play button if we're not playing a track
 * from this media list).
 */
export function PlayMediaListButton(props: {
  trackSource: PlayFromSource;
  className?: string;
}) {
  const { t } = useTranslation();
  const currSource = usePlaybackStore((s) => s.playingFrom);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);

  const isThisSource = arePlaybackSourceEqual(currSource, props.trackSource);
  const displayPause = isThisSource && isPlaying;

  return (
    <FilledIconButton
      Icon={displayPause ? Pause : PlayArrow}
      accessibilityLabel={t(`term.${displayPause ? "pause" : "play"}`)}
      onPress={() =>
        displayPause
          ? PlaybackControls.pause()
          : PlaybackControls.playFromList({ source: props.trackSource })
      }
      className={cn(
        "rounded-full bg-primary active:bg-primaryDim",
        {
          "bg-surfaceContainerHigh active:bg-surfaceContainerHighest":
            displayPause,
        },
        props.className,
      )}
      _iconColor="onPrimary"
    />
  );
}
