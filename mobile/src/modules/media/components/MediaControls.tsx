// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useTranslation } from "react-i18next";

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
      icon={repeatMode === "no-repeat" ? "repeat" : repeatMode}
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
      icon="shuffle"
      accessibilityLabel={t("term.shuffle")}
      onPress={PlaybackSettings.toggleShuffle}
      size={size}
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
      icon={isPlaying ? "pause-filled" : "play-arrow-filled"}
      accessibilityLabel={t(`term.${isPlaying ? "pause" : "play"}`)}
      onPress={() => PlaybackControls.playToggle()}
      className={cn("bg-primary px-6 py-2", {
        "bg-surfaceContainerHigh": isPlaying,
      })}
      size="lg"
      rippleColor={isPlaying ? "surfaceContainerHighest" : "primaryDim"}
      _iconColor="onPrimary"
    />
  );
}

/** Play the next track. */
export function NextButton({ size = "lg" }: { size?: ButtonSize }) {
  const { t } = useTranslation();
  return (
    <IconButton
      icon="skip-next-filled"
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
      icon="skip-previous-filled"
      accessibilityLabel={t("term.prev")}
      onPress={PlaybackControls.prev}
      size={size}
    />
  );
}
