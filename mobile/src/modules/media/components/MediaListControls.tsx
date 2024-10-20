import { View } from "react-native";

import { PlayArrow, Pause } from "../resources/icons";
import { useMusicStore } from "../services/Music";
import { MusicControls, playFromMediaList } from "../services/Playback";

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";
import { Button } from "@/components/new/Form";
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
  const currSource = useMusicStore((state) => state.playingSource);
  const isPlaying = useMusicStore((state) => state.isPlaying);

  const isThisSource = arePlaybackSourceEqual(currSource, trackSource);
  const displayPause = isThisSource && isPlaying;

  const Icon = displayPause ? Pause : PlayArrow;

  return (
    <Button
      preset="danger"
      onPress={
        displayPause
          ? MusicControls.pause
          : () => playFromMediaList({ source: trackSource })
      }
      icon
      className={cn({ "bg-neutral80 dark:bg-neutral20": displayPause })}
    >
      <Icon size={24} color={Colors.neutral100} />
    </Button>
  );
}
