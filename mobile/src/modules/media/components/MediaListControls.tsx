import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Pause } from "~/resources/icons/Pause";
import { PlayArrow } from "~/resources/icons/PlayArrow";
import { usePlaybackStore } from "~/stores/Playback/store";
import { pause, playFromList } from "~/stores/Playback/actions";

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
  const currSource = usePlaybackStore((s) => s.playingFrom);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);

  const isThisSource = arePlaybackSourceEqual(currSource, trackSource);
  const displayPause = isThisSource && isPlaying;

  const Icon = displayPause ? Pause : PlayArrow;

  return (
    <Button
      accessibilityLabel={t(`term.${displayPause ? "pause" : "play"}`)}
      onPress={() =>
        displayPause ? pause() : playFromList({ source: trackSource })
      }
      className={cn("bg-red p-3", { "bg-onSurface": displayPause })}
    >
      <Icon color={Colors.neutral100} />
    </Button>
  );
}
