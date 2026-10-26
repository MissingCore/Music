// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useTranslation } from "react-i18next";

import { usePlaybackStore } from "~/stores/Playback/store";
import { PlaybackControls, PlaybackSettings } from "~/stores/Playback/actions";
import { arePlaybackSourceEqual } from "~/stores/Playback/utils";
import type { PlayFromSource } from "~/stores/Playback/types";

import type {
  ButtonSize,
  IconButtonProps,
} from "~/components/next/base/button-icon";
import { IconButton } from "~/components/next/base/button-icon";

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
      onPress={() => PlaybackSettings.toggleShuffle()}
      size={size}
      _iconColor={isActive ? "primary" : undefined}
    />
  );
}

/**
 * Toggles whether we're playing or not. The displayed state can be linked
 * to a specific list.
 */
export function PlayToggleButton({
  trackSource,
  size = "lg",
  wide = true,
  className,
}: {
  trackSource?: PlayFromSource;
} & Pick<IconButtonProps, "size" | "wide" | "className">) {
  const { t } = useTranslation();
  const isPlaying = usePlaybackStore((s) =>
    trackSource
      ? arePlaybackSourceEqual(s.playingFrom, trackSource) && s.isPlaying
      : s.isPlaying,
  );

  return (
    <IconButton
      icon={isPlaying ? "pause-filled" : "play-arrow-filled"}
      accessibilityLabel={t(`term.${isPlaying ? "pause" : "play"}`)}
      onPress={() =>
        trackSource
          ? isPlaying
            ? PlaybackControls.pause()
            : PlaybackControls.playFromList({ source: trackSource })
          : PlaybackControls.playToggle()
      }
      className={className}
      intent={isPlaying ? "muted" : "primary"}
      filled
      size={size}
      wide={wide}
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
