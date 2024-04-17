import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Pressable } from "react-native";

import { repeatAtom, shuffleAtom } from "../api/configs";
import { isPlayingAtom, toggleIsPlayingAtom } from "../api/controls";

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

  if (isActive.state !== "hasData") {
    return (
      <Ionicons
        name={`${props.type}-sharp`}
        size={props.size}
        color={Colors.surface500}
        className="p-2"
      />
    );
  }

  return (
    <Pressable onPress={() => setIsActive(!isActive.data)} className="p-2">
      <Ionicons
        name={`${props.type}-sharp`}
        size={props.size}
        color={isActive.data ? Colors.accent500 : Colors.foreground50}
      />
    </Pressable>
  );
}

type PlayButtonProps = { size?: number; className?: string };

/** @description Toggles whether we're playing or not. */
export function PlayButton({ size = 24, className }: PlayButtonProps) {
  const isPlaying = useAtomValue(isPlayingAtom);
  const toggleIsPlaying = useSetAtom(toggleIsPlayingAtom);

  return (
    <Pressable
      onPress={toggleIsPlaying}
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
