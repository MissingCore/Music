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
import type { ButtonSize } from "~/components/Form/Button/Icon";
import { FilledIconButton, IconButton } from "~/components/Form/Button/Icon";

/** Toggles the repeat status. */
export function RepeatButton({ size = "lg" }: { size?: ButtonSize }) {
  const { t } = useTranslation();
  const repeatMode = usePlaybackStore((s) => s.repeat);

  return (
    <IconButton
      Icon={repeatMode === "repeat-one" ? RepeatOne : Repeat}
      accessibilityLabel={t(
        `term.repeat${repeatMode === "repeat-one" ? "One" : ""}`,
      )}
      onPress={PlaybackSettings.cycleRepeat}
      size={size}
      _iconColor={repeatMode !== "no-repeat" ? "primary" : undefined}
    />
  );
}

/** Toggles the shuffle status. */
export function ShuffleButton({ size = "lg" }: { size?: ButtonSize }) {
  const { t } = useTranslation();
  const isActive = usePlaybackStore((s) => s.shuffle);
  return (
    <IconButton
      Icon={Shuffle}
      accessibilityLabel={t("term.shuffle")}
      onPress={PlaybackSettings.toggleShuffle}
      size={size}
      _iconColor={isActive ? "primary" : undefined}
    />
  );
}

/** Toggles whether we're playing or not. */
export function PlayToggleButton({
  size = "lg",
  className,
}: {
  size?: ButtonSize;
  className?: string;
}) {
  const { t } = useTranslation();
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  return (
    <FilledIconButton
      Icon={isPlaying ? Pause : PlayArrow}
      accessibilityLabel={t(`term.${isPlaying ? "pause" : "play"}`)}
      onPress={() => PlaybackControls.playToggle()}
      size={size}
      className={cn(
        "bg-primary px-6 py-2 active:bg-primaryDim",
        {
          "bg-surfaceContainerHigh active:bg-surfaceContainerHighest":
            isPlaying,
        },
        className,
      )}
      _iconColor="onPrimary"
    />
  );
}

/** Play the next track. */
export function NextButton({ size = "lg" }: { size?: ButtonSize }) {
  const { t } = useTranslation();
  return (
    <IconButton
      Icon={SkipNext}
      accessibilityLabel={t("term.next")}
      onPress={() => PlaybackControls.next()}
      size={size}
    />
  );
}

/** Play the previous track. */
export function PreviousButton({ size = "lg" }: { size?: ButtonSize }) {
  const { t } = useTranslation();
  return (
    <IconButton
      Icon={SkipPrevious}
      accessibilityLabel={t("term.prev")}
      onPress={PlaybackControls.prev}
      size={size}
    />
  );
}
