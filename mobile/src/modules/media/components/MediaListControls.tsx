import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Pause, PlayArrow } from "@/icons";
import { useMusicStore } from "../services/Music";
import { MusicControls, playFromMediaList } from "../services/Playback";

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";
import { IconButton } from "@/components/new/Form";
import { RepeatButton, ShuffleButton } from "./MediaControls";
import { arePlaybackSourceEqual } from "../helpers/data";
import type { PlayListSource } from "../types";

/** Media controls used on media list pages. */
export function MediaListControls({
  trackSource,
}: {
  trackSource: PlayListSource;
}) {
  return (
    <View className="flex-row items-center gap-1">
      <RepeatButton size={24} />
      <ShuffleButton size={24} />
      <PlayMediaListButton trackSource={trackSource} />
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
    <IconButton
      accessibilityLabel={t(`common.${displayPause ? "pause" : "play"}`)}
      onPress={
        displayPause
          ? MusicControls.pause
          : () => playFromMediaList({ source: trackSource })
      }
      className={cn("bg-red", {
        "bg-neutral80 dark:bg-neutral20": displayPause,
      })}
    >
      <Icon color={Colors.neutral100} />
    </IconButton>
  );
}
