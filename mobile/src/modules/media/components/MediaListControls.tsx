import { useAtomValue, useSetAtom } from "jotai";
import { Pressable, View } from "react-native";

import { MaterialIcons } from "@/resources/icons";
import { MusicControls, playFromMediaListAtom } from "../services/Playback";
import { SyncAtomState } from "../services/State";

import { cn } from "@/lib/style";
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
    <View className="flex-row items-center">
      <RepeatButton />
      <ShuffleButton />
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
  const currSource = useAtomValue(SyncAtomState.playingSource);
  const isPlaying = useAtomValue(SyncAtomState.isPlaying);
  const playFromMediaListFn = useSetAtom(playFromMediaListAtom);

  const isThisSource = arePlaybackSourceEqual(currSource, trackSource);
  const displayPause = isThisSource && isPlaying;

  return (
    <Pressable
      onPress={
        displayPause
          ? MusicControls.pause
          : () => playFromMediaListFn({ source: trackSource })
      }
      className={cn("ml-1 rounded-full bg-accent500 p-1 active:opacity-75", {
        "bg-surface500": displayPause,
      })}
    >
      <MaterialIcons name={displayPause ? "pause" : "play-arrow"} size={24} />
    </Pressable>
  );
}
