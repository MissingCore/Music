import { useAtom, useAtomValue } from "jotai";
import { Pressable } from "react-native";

import { Ionicons, MaterialIcons } from "@/resources/icons";
import { repeatAtom, shuffleAtom } from "../services/Persistent";
import { MusicControls, isPlayingAtom } from "../services/Playback";

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";
import { StyledPressable } from "@/components/ui/pressable";

/** Toggles the repeat status. */
export function RepeatButton({ size = 24 }) {
  const [isActive, setIsActive] = useAtom(repeatAtom);
  return (
    <StyledPressable
      android_ripple={{ color: Colors.surface700, radius: size * 0.75 }}
      onPress={() => setIsActive(!isActive)}
      className="p-2"
    >
      <Ionicons
        name="repeat-sharp"
        size={size}
        color={isActive ? Colors.accent500 : Colors.foreground50}
      />
    </StyledPressable>
  );
}

/** Toggles the shuffle status. */
export function ShuffleButton({ size = 24 }) {
  const [isActive, toggleStatus] = useAtom(shuffleAtom);
  return (
    <StyledPressable
      android_ripple={{ color: Colors.surface700, radius: size * 0.75 }}
      onPress={toggleStatus}
      className="p-2"
    >
      <Ionicons
        name="shuffle-sharp"
        size={size}
        color={isActive ? Colors.accent500 : Colors.foreground50}
      />
    </StyledPressable>
  );
}

/** Toggles whether we're playing or not. */
export function PlayToggleButton({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const isPlaying = useAtomValue(isPlayingAtom);
  return (
    <Pressable
      onPress={MusicControls.playToggle}
      className={cn(
        "rounded-full bg-accent500 p-1 active:opacity-75",
        { "bg-surface500": isPlaying },
        className,
      )}
    >
      <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={size} />
    </Pressable>
  );
}

/** Play the next track. */
export function NextButton({ size = 24 }) {
  return (
    <StyledPressable
      android_ripple={{ color: Colors.surface700, radius: size * 0.75 }}
      onPress={MusicControls.next}
      className="p-2"
    >
      <MaterialIcons name="skip-next" size={size} />
    </StyledPressable>
  );
}

/** Play the previous track. */
export function PreviousButton({ size = 24 }) {
  return (
    <StyledPressable
      android_ripple={{ color: Colors.surface700, radius: size * 0.75 }}
      onPress={MusicControls.prev}
      className="p-2"
    >
      <MaterialIcons name="skip-previous" size={size} />
    </StyledPressable>
  );
}
