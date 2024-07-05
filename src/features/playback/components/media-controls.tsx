import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Pressable, View } from "react-native";

import { repeatAtom, shuffleAtom } from "../api/configs";
import {
  isPlayingAtom,
  nextAtom,
  pauseAtom,
  playAtom,
  playPauseToggleAtom,
  prevAtom,
} from "../api/actions";
import { trackListAtom } from "../api/track";
import type { TrackListSource } from "../types";
import { areTrackReferencesEqual } from "../utils";

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";
import { StyledPressable } from "@/components/ui/pressable";

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
    <StyledPressable
      android_ripple={{ color: Colors.surface700, radius: props.size * 0.75 }}
      onPress={() => setIsActive(!isActive)}
      className="p-2"
    >
      <View className="pointer-events-none">
        <Ionicons
          name={`${props.type}-sharp`}
          size={props.size}
          color={isActive ? Colors.accent500 : Colors.foreground50}
        />
      </View>
    </StyledPressable>
  );
}

/**
 * @description For pages where we want to link "toggle" behavior to the
 *  content of the page (ie: show play button if we're not playing a
 *  track from this track list).
 */
export function PlayButton({
  size = 24,
  trackSource,
  className,
}: PlayToggleButtonProps & { trackSource: TrackListSource }) {
  const { reference } = useAtomValue(trackListAtom);
  const isPlaying = useAtomValue(isPlayingAtom);
  const pauseFn = useSetAtom(pauseAtom);
  const playFn = useSetAtom(playAtom);

  const isThisSource = areTrackReferencesEqual(reference, trackSource);
  const displayPause = isThisSource && isPlaying;

  return (
    <Pressable
      onPress={displayPause ? pauseFn : () => playFn({ source: trackSource })}
      className={cn(
        "rounded-full bg-accent500 p-1 active:opacity-75",
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
        "rounded-full bg-accent500 p-1 active:opacity-75",
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
  const nextTrackFn = useSetAtom(nextAtom);
  return (
    <StyledPressable
      android_ripple={{ color: Colors.surface700, radius: size * 0.75 }}
      onPress={nextTrackFn}
      className="p-2"
    >
      <View className="pointer-events-none">
        <MaterialIcons
          name="skip-next"
          size={size}
          color={Colors.foreground50}
        />
      </View>
    </StyledPressable>
  );
}

/** @description Play the previous track. */
export function PreviousButton({ size = 24 }) {
  const prevTrackFn = useSetAtom(prevAtom);
  return (
    <StyledPressable
      android_ripple={{ color: Colors.surface700, radius: size * 0.75 }}
      onPress={prevTrackFn}
      className="p-2"
    >
      <View className="pointer-events-none">
        <MaterialIcons
          name="skip-previous"
          size={size}
          color={Colors.foreground50}
        />
      </View>
    </StyledPressable>
  );
}
