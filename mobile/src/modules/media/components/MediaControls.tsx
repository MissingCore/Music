import { useTranslation } from "react-i18next";

import { Pause } from "~/resources/icons/Pause";
import { PlayArrow } from "~/resources/icons/PlayArrow";
import { Repeat } from "~/resources/icons/Repeat";
import { RepeatOne } from "~/resources/icons/RepeatOne";
import { Shuffle } from "~/resources/icons/Shuffle";
import { SkipNext } from "~/resources/icons/SkipNext";
import { SkipPrevious } from "~/resources/icons/SkipPrevious";
import { usePlaybackStore } from "~/stores/Playback/store";
import {
  cycleRepeat,
  toggleShuffle,
  next,
  playToggle,
  prev,
} from "~/stores/Playback/actions";

import { Colors } from "~/constants/Styles";
import { cn } from "~/lib/style";
import { Button, IconButton } from "~/components/Form/Button";

/** Toggles the repeat status. */
export function RepeatButton({ large = true }) {
  const { t } = useTranslation();
  const repeatMode = usePlaybackStore((s) => s.repeat);

  return (
    <IconButton
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
  const isActive = usePlaybackStore((s) => s.shuffle);
  return (
    <IconButton
      Icon={Shuffle}
      accessibilityLabel={t("term.shuffle")}
      onPress={toggleShuffle}
      active={isActive}
      large={large}
    />
  );
}

/** Toggles whether we're playing or not. */
export function PlayToggleButton() {
  const { t } = useTranslation();
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const Icon = isPlaying ? Pause : PlayArrow;
  return (
    <Button
      accessibilityLabel={t(`term.${isPlaying ? "pause" : "play"}`)}
      onPress={() => playToggle()}
      className={cn("rounded-full bg-red px-6 py-2", {
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
    <IconButton
      Icon={SkipNext}
      accessibilityLabel={t("term.next")}
      onPress={() => next()}
      large={large}
    />
  );
}

/** Play the previous track. */
export function PreviousButton({ large = true }) {
  const { t } = useTranslation();
  return (
    <IconButton
      Icon={SkipPrevious}
      accessibilityLabel={t("term.prev")}
      onPress={prev}
      large={large}
    />
  );
}
