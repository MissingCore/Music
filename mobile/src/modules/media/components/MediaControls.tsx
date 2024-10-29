import { useTranslation } from "react-i18next";

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

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";
import { Button, Ripple } from "@/components/new/Form";

type MediaControlProps = { size?: number; rippleColor?: string };

/** Toggles the repeat status. */
export function RepeatButton({ size = 32, rippleColor }: MediaControlProps) {
  const { t } = useTranslation();
  const isActive = useMusicStore((state) => state.repeat);
  const setRepeat = useMusicStore((state) => state.setRepeat);
  return (
    <Ripple
      accessibilityLabel={t("common.repeat")}
      android_ripple={{
        radius: size * 0.75,
        ...(rippleColor ? { color: rippleColor } : {}),
      }}
      onPress={() => setRepeat(!isActive)}
      className="min-w-12 justify-center p-2"
    >
      <Repeat size={size} {...(isActive ? { color: Colors.red } : {})} />
    </Ripple>
  );
}

/** Toggles the shuffle status. */
export function ShuffleButton({ size = 32, rippleColor }: MediaControlProps) {
  const { t } = useTranslation();
  const isActive = useMusicStore((state) => state.shuffle);
  const setShuffle = useMusicStore((state) => state.setShuffle);
  return (
    <Ripple
      accessibilityLabel={t("common.shuffle")}
      android_ripple={{
        radius: size * 0.75,
        ...(rippleColor ? { color: rippleColor } : {}),
      }}
      onPress={() => setShuffle(!isActive)}
      className="min-w-12 justify-center p-2"
    >
      <Shuffle size={size} {...(isActive ? { color: Colors.red } : {})} />
    </Ripple>
  );
}

/** Toggles whether we're playing or not. */
export function PlayToggleButton({ size = 32, className = "" }) {
  const { t } = useTranslation();
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const Icon = isPlaying ? Pause : PlayArrow;
  return (
    <Button
      preset={isPlaying ? "plain" : "danger"}
      accessibilityLabel={t(`common.${isPlaying ? "pause" : "play"}`)}
      onPress={MusicControls.playToggle}
      className={cn(
        "min-w-12 justify-center p-2",
        { "bg-neutral80 dark:bg-neutral20": isPlaying },
        className,
      )}
    >
      <Icon size={size} color={Colors.neutral100} />
    </Button>
  );
}

/** Play the next track. */
export function NextButton({ size = 32, rippleColor }: MediaControlProps) {
  const { t } = useTranslation();
  return (
    <Ripple
      accessibilityLabel={t("common.next")}
      android_ripple={{
        radius: size * 0.75,
        ...(rippleColor ? { color: rippleColor } : {}),
      }}
      onPress={MusicControls.next}
      className="min-w-12 justify-center p-2"
    >
      <SkipNext size={size} />
    </Ripple>
  );
}

/** Play the previous track. */
export function PreviousButton({ size = 32, rippleColor }: MediaControlProps) {
  const { t } = useTranslation();
  return (
    <Ripple
      accessibilityLabel={t("common.prev")}
      android_ripple={{
        radius: size * 0.75,
        ...(rippleColor ? { color: rippleColor } : {}),
      }}
      onPress={MusicControls.prev}
      className="min-w-12 justify-center p-2"
    >
      <SkipPrevious size={size} />
    </Ripple>
  );
}
