import { useTranslation } from "react-i18next";

import { Pause } from "~/icons/Pause";
import { PlayArrow } from "~/icons/PlayArrow";
import { Repeat } from "~/icons/Repeat";
import { RepeatOne } from "~/icons/RepeatOne";
import { Shuffle } from "~/icons/Shuffle";
import { SkipNext } from "~/icons/SkipNext";
import { SkipPrevious } from "~/icons/SkipPrevious";
import { useMusicStore } from "../services/Music";
import { MusicControls } from "../services/Playback";

import { Colors } from "~/constants/Styles";
import { cn } from "~/lib/style";
import { Button, NextIconButton } from "~/components/Form/Button";

/** Toggles the repeat status. */
export function RepeatButton({ large = true }) {
  const { t } = useTranslation();
  const repeatMode = useMusicStore((state) => state.repeat);
  const cycleRepeat = useMusicStore((state) => state.cycleRepeat);

  return (
    <NextIconButton
      Icon={repeatMode === "repeat-one" ? RepeatOne : Repeat}
      accessibilityLabel={t(
        `term.repeat${repeatMode === "repeat-one" ? "One" : ""}`,
      )}
      onPress={cycleRepeat}
      active={repeatMode !== "no-repeat"}
      large={large}
    />
  );
}

/** Toggles the shuffle status. */
export function ShuffleButton({ large = true }) {
  const { t } = useTranslation();
  const isActive = useMusicStore((state) => state.shuffle);
  const setShuffle = useMusicStore((state) => state.setShuffle);
  return (
    <NextIconButton
      Icon={Shuffle}
      accessibilityLabel={t("term.shuffle")}
      onPress={() => setShuffle(!isActive)}
      active={isActive}
      large={large}
    />
  );
}

/** Toggles whether we're playing or not. */
export function PlayToggleButton() {
  const { t } = useTranslation();
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const Icon = isPlaying ? Pause : PlayArrow;
  return (
    <Button
      accessibilityLabel={t(`term.${isPlaying ? "pause" : "play"}`)}
      onPress={MusicControls.playToggle}
      className={cn("min-w-12 rounded-full bg-red px-6 py-2", {
        "bg-onSurface": isPlaying,
      })}
    >
      <Icon size={32} color={Colors.neutral100} />
    </Button>
  );
}

/** Play the next track. */
export function NextButton({ large = true }) {
  const { t } = useTranslation();
  return (
    <NextIconButton
      Icon={SkipNext}
      accessibilityLabel={t("term.next")}
      onPress={MusicControls.next}
      large={large}
    />
  );
}

/** Play the previous track. */
export function PreviousButton({ large = true }) {
  const { t } = useTranslation();
  return (
    <NextIconButton
      Icon={SkipPrevious}
      accessibilityLabel={t("term.prev")}
      onPress={MusicControls.prev}
      large={large}
    />
  );
}
