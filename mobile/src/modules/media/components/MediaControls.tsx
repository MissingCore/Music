import { useTranslation } from "react-i18next";

import { Pause } from "~/resources/icons/Pause";
import { PlayArrow } from "~/resources/icons/PlayArrow";
import { Repeat } from "~/resources/icons/Repeat";
import { RepeatOne } from "~/resources/icons/RepeatOne";
import { Shuffle } from "~/resources/icons/Shuffle";
import { SkipNext } from "~/resources/icons/SkipNext";
import { SkipPrevious } from "~/resources/icons/SkipPrevious";
import { usePlaybackStore } from "~/stores/Playback/store";
import { PlaybackControls, PlaybackSettings } from "~/stores/Playback/actions";

import { cn } from "~/lib/style";
import { FilledIconButton, IconButton } from "~/components/Form/Button/Icon";

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
      onPress={PlaybackSettings.cycleRepeat}
      size={large ? "lg" : undefined}
      _iconColor={repeatMode !== "no-repeat" ? "primary" : undefined}
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
      onPress={PlaybackSettings.toggleShuffle}
      size={large ? "lg" : undefined}
      _iconColor={isActive ? "primary" : undefined}
    />
  );
}

/** Toggles whether we're playing or not. */
export function PlayToggleButton() {
  const { t } = useTranslation();
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  return (
    <FilledIconButton
      Icon={isPlaying ? Pause : PlayArrow}
      accessibilityLabel={t(`term.${isPlaying ? "pause" : "play"}`)}
      onPress={() => PlaybackControls.playToggle()}
      size="lg"
      className={cn("bg-primary px-6 py-2 active:bg-primaryDim", {
        "bg-surfaceContainerHigh active:bg-surfaceContainerHighest": isPlaying,
      })}
      _iconColor="onPrimary"
    />
  );
}

/** Play the next track. */
export function NextButton({ large = true }) {
  const { t } = useTranslation();
  return (
    <IconButton
      Icon={SkipNext}
      accessibilityLabel={t("term.next")}
      onPress={() => PlaybackControls.next()}
      size={large ? "lg" : undefined}
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
      onPress={PlaybackControls.prev}
      size={large ? "lg" : undefined}
    />
  );
}
