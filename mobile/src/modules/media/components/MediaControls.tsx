import {
  Pause,
  PlayArrow,
  Repeat,
  Shuffle,
  SkipNext,
  SkipPrevious,
} from "../resources/icons";
import { useMusicStore } from "../services/Music";
import { MusicControls } from "../services/Playback";

import { cn } from "@/lib/style";
import { Colors } from "@/constants/Styles";
import { Ripple } from "@/components/new/Form";

/** Toggles the repeat status. */
export function RepeatButton({ size = 32 }) {
  const isActive = useMusicStore((state) => state.repeat);
  const setRepeat = useMusicStore((state) => state.setRepeat);
  return (
    <Ripple
      android_ripple={{ radius: size * 0.75 }}
      onPress={() => setRepeat(!isActive)}
      className="p-2"
    >
      <Repeat size={size} {...(isActive ? { color: Colors.red } : {})} />
    </Ripple>
  );
}

/** Toggles the shuffle status. */
export function ShuffleButton({ size = 32 }) {
  const isActive = useMusicStore((state) => state.shuffle);
  const setShuffle = useMusicStore((state) => state.setShuffle);
  return (
    <Ripple
      android_ripple={{ radius: size * 0.75 }}
      onPress={() => setShuffle(!isActive)}
      className="p-2"
    >
      <Shuffle size={size} {...(isActive ? { color: Colors.red } : {})} />
    </Ripple>
  );
}

/** Toggles whether we're playing or not. */
export function PlayToggleButton({ size = 32, className = "" }) {
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const Icon = isPlaying ? Pause : PlayArrow;
  return (
    <Ripple
      android_ripple={{ radius: size * 0.75 }}
      onPress={MusicControls.playToggle}
      className={cn("p-2", className)}
    >
      <Icon size={size} color={Colors.red} />
    </Ripple>
  );
}

/** Play the next track. */
export function NextButton({ size = 32 }) {
  return (
    <Ripple
      android_ripple={{ radius: size * 0.75 }}
      onPress={MusicControls.next}
      className="p-2"
    >
      <SkipNext size={size} />
    </Ripple>
  );
}

/** Play the previous track. */
export function PreviousButton({ size = 32 }) {
  return (
    <Ripple
      android_ripple={{ radius: size * 0.75 }}
      onPress={MusicControls.prev}
      className="p-2"
    >
      <SkipPrevious size={size} />
    </Ripple>
  );
}
