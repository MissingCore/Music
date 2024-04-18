import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Pressable } from "react-native";

import { repeatAtom, shuffleAtom } from "../api/configs";
import {
  isPlayingAtom,
  pauseAtom,
  playAtom,
  playPauseToggleAtom,
} from "../api/controls";
import { playingInfoAtom } from "../api/playing";
import { isTrackSrcsEqual } from "../utils/comparison";
import type { TTrackSrc } from "../utils/trackList";

import Colors from "@/constants/Colors";
import { cn } from "@/lib/style";

/**
 * @description Toggles whether we'll keep playing after we reach the
 *  end of the tracks list.
 */
export function RepeatButton({ size = 24 }) {
  return <MediaToggleButton type="repeat" size={size} atom={repeatAtom} />;
}

/**
 * @description Toggles whether the next track will be a random unplayed
 *  track in the given tracks list.
 */
export function ShuffleButton({ size = 24 }) {
  return <MediaToggleButton type="shuffle" size={size} atom={shuffleAtom} />;
}

/** @description Reusable toggleable media control button. */
function MediaToggleButton(props: {
  type: "repeat" | "shuffle";
  atom: typeof repeatAtom;
  size: number;
}) {
  const [isActive, setIsActive] = useAtom(props.atom);

  return (
    <Pressable onPress={() => setIsActive(!isActive)} className="p-2">
      <Ionicons
        name={`${props.type}-sharp`}
        size={props.size}
        color={isActive ? Colors.accent500 : Colors.foreground50}
      />
    </Pressable>
  );
}

/**
 * @description For pages where we want to link "toggle" behavior to the
 *  content of the page (ie: show play button if we're not playing a
 *  track from this track list).
 */
export function PlayButton({
  size = 24,
  trackSrc,
  className,
}: PlayToggleButtonProps & { trackSrc: TTrackSrc }) {
  const { listSrc } = useAtomValue(playingInfoAtom);
  const isPlaying = useAtomValue(isPlayingAtom);
  const pauseFn = useSetAtom(pauseAtom);
  const playFn = useSetAtom(playAtom);

  const isTrackSrcSame = isTrackSrcsEqual(listSrc, trackSrc);
  const displayPause = isTrackSrcSame && isPlaying;

  return (
    <Pressable
      onPress={displayPause ? pauseFn : () => playFn({ trackSrc })}
      className={cn(
        "rounded-full bg-accent500 p-1",
        { "bg-surface500": displayPause },
        className,
      )}
    >
      <MaterialIcons
        name={displayPause ? "pause" : "play-arrow"}
        size={size}
        color={Colors.foreground50}
      />
    </Pressable>
  );
}

type PlayToggleButtonProps = { size?: number; className?: string };

/** @description Toggles whether we're playing or not. */
export function PlayToggleButton({
  size = 24,
  className,
}: PlayToggleButtonProps) {
  const isPlaying = useAtomValue(isPlayingAtom);
  const playPauseToggle = useSetAtom(playPauseToggleAtom);

  return (
    <Pressable
      onPress={playPauseToggle}
      className={cn(
        "rounded-full bg-accent500 p-1",
        { "bg-surface500": isPlaying },
        className,
      )}
    >
      <MaterialIcons
        name={isPlaying ? "pause" : "play-arrow"}
        size={size}
        color={Colors.foreground50}
      />
    </Pressable>
  );
}

/** @description Play the next track. */
export function NextButton({ size = 24 }) {
  return (
    <Pressable
      onPress={() => console.log("Playing next track...")}
      className="p-2"
    >
      <MaterialIcons name="skip-next" size={size} color={Colors.foreground50} />
    </Pressable>
  );
}

/** @description Play the previous track. */
export function PreviousButton({ size = 24 }) {
  return (
    <Pressable
      onPress={() => console.log("Playing previous track...")}
      className="p-2"
    >
      <MaterialIcons
        name="skip-previous"
        size={size}
        color={Colors.foreground50}
      />
    </Pressable>
  );
}
