import { useTranslation } from "react-i18next";

import {
  Pause,
  PlayArrow,
  Repeat,
  Shuffle,
  SkipNext,
  SkipPrevious,
} from "@/icons";
import { useMusicStore } from "../services/Music";
import { MusicControls } from "../services/Playback";

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";
import { IconButton } from "@/components/new/Form";

type MediaControlProps = { size?: number };

/** Toggles the repeat status. */
export function RepeatButton({ size = 32 }: MediaControlProps) {
  const { t } = useTranslation();
  const isActive = useMusicStore((state) => state.repeat);
  const setRepeat = useMusicStore((state) => state.setRepeat);
  return (
    <IconButton
      kind="ripple"
      accessibilityLabel={t("common.repeat")}
      onPress={() => setRepeat(!isActive)}
      rippleRadius={size * 0.75}
      className="p-2"
    >
      <Repeat size={size} {...(isActive ? { color: Colors.red } : {})} />
    </IconButton>
  );
}

/** Toggles the shuffle status. */
export function ShuffleButton({ size = 32 }: MediaControlProps) {
  const { t } = useTranslation();
  const isActive = useMusicStore((state) => state.shuffle);
  const setShuffle = useMusicStore((state) => state.setShuffle);
  return (
    <IconButton
      kind="ripple"
      accessibilityLabel={t("common.shuffle")}
      onPress={() => setShuffle(!isActive)}
      rippleRadius={size * 0.75}
      className="p-2"
    >
      <Shuffle size={size} {...(isActive ? { color: Colors.red } : {})} />
    </IconButton>
  );
}

/** Toggles whether we're playing or not. */
export function PlayToggleButton({ size = 32, className = "" }) {
  const { t } = useTranslation();
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const Icon = isPlaying ? Pause : PlayArrow;
  return (
    <IconButton
      accessibilityLabel={t(`common.${isPlaying ? "pause" : "play"}`)}
      onPress={MusicControls.playToggle}
      className={cn(
        "bg-red p-2",
        { "bg-neutral80 dark:bg-neutral20": isPlaying },
        className,
      )}
    >
      <Icon size={size} color={Colors.neutral100} />
    </IconButton>
  );
}

/** Play the next track. */
export function NextButton({ size = 32 }: MediaControlProps) {
  const { t } = useTranslation();
  return (
    <IconButton
      kind="ripple"
      accessibilityLabel={t("common.next")}
      onPress={MusicControls.next}
      rippleRadius={size * 0.75}
      className="p-2"
    >
      <SkipNext size={size} />
    </IconButton>
  );
}

/** Play the previous track. */
export function PreviousButton({ size = 32 }: MediaControlProps) {
  const { t } = useTranslation();
  return (
    <IconButton
      kind="ripple"
      accessibilityLabel={t("common.prev")}
      onPress={MusicControls.prev}
      rippleRadius={size * 0.75}
      className="p-2"
    >
      <SkipPrevious size={size} />
    </IconButton>
  );
}
