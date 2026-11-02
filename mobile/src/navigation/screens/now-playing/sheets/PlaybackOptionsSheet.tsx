// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AudioBrowser from "react-native-audio-browser";
import { scheduleOnRN } from "react-native-worklets";

import { playbackStore, usePlaybackStore } from "~/stores/Playback/store";
import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";
import { PlaybackDelayConfig } from "~/stores/Preference/utils";

import { getMediaLinkContext } from "~/navigation/utils/router";
import { AppearanceSheet } from "./AppearanceSheet";

import { NothingSlider } from "~/components/Form/Slider.variant";
import { Button } from "~/components/next/base/button";
import type { SheetRef } from "~/components/next/base/sheet";
import { ScrollableSheet, useSheetRef } from "~/components/next/base/sheet";
import type { LabeledSliderProps } from "~/components/next/blocks/slider-labeled";
import { LabeledSlider } from "~/components/next/blocks/slider-labeled";
import { TextStack } from "~/components/next/blocks/text-stack";
import * as List from "~/components/next/composed/list";
import { PlayingIndicator } from "~/modules/media/components/AnimatedBars";

export function PlaybackOptionsSheet(props: {
  ref: SheetRef;
  trackId: string;
}) {
  const { t } = useTranslation();
  const navigation = useNavigation("NowPlaying");
  const [stopDrag, setStopDrag] = useState(false);
  const playingSource = usePlaybackStore((s) => s.playingFrom);
  const sourceName = usePlaybackStore((s) => s.playingFromName);
  const playbackDelay = usePreferenceStore((s) => s.playbackDelay);
  const volume = usePlaybackStore((s) => s.volume);
  const appearanceSheetRef = useSheetRef();

  const navigateToList = useCallback(async () => {
    if (!playingSource) return;
    await props.ref.current?.dismiss();
    navigation.popTo(...getMediaLinkContext(playingSource));
  }, [navigation, props.ref, playingSource]);

  const navigateToAudioEffectsScreen = useCallback(async () => {
    await props.ref.current?.dismiss();
    navigation.navigate("AudioEffects", { showHidden: true });
  }, [navigation, props.ref]);

  //#region Sheet Presenters
  const presentAppearanceSheet = useCallback(async () => {
    await props.ref.current?.dismiss();
    appearanceSheetRef.current?.present();
  }, [appearanceSheetRef, props.ref]);
  //#endregion

  const playbackDelaySliderOptions = useMemo<
    Omit<LabeledSliderProps, "initValue">
  >(
    () => ({
      ...PlaybackDelayConfig.bound,
      label: t("feat.playback.extra.delay"),
      formatValue: (value) => {
        "worklet";
        return `${value}s`;
      },
      onChange: (value) => {
        "worklet";
        scheduleOnRN(PreferenceSetters.setPlaybackDelay, value);
      },
      onStatusChange: (status) => {
        "worklet";
        scheduleOnRN(setStopDrag, status !== "idle");
      },
    }),
    [t, setStopDrag],
  );

  return (
    <>
      <AppearanceSheet ref={appearanceSheetRef} />

      <ScrollableSheet ref={props.ref} draggable={!stopDrag}>
        <Button
          onPress={navigateToList}
          disabled={!sourceName}
          className="rounded-lg py-2 pl-2"
        >
          <PlayingIndicator />
          <TextStack
            label={t("term.playingFrom")}
            supporting={sourceName || "—"}
            clamp
          />
        </Button>

        <NothingSlider
          initValue={volume}
          getInteractionStatus={setStopDrag}
          {...VolumeSliderOptions}
        />
        <LabeledSlider
          initValue={playbackDelay}
          {...playbackDelaySliderOptions}
        />

        <List.Group>
          <List.Item
            icon="format-paint"
            label={t("feat.appearance.title")}
            onPress={presentAppearanceSheet}
          />
          <List.Divider />
          <List.Item
            icon="graphic-eq"
            label={t("feat.audioEffects.title")}
            onPress={navigateToAudioEffectsScreen}
          />
        </List.Group>
      </ScrollableSheet>
    </>
  );
}

//#region Slider Configs
const VolumeSliderOptions = {
  min: 0,
  max: 1,
  step: 0.01,
  onChange: (volume: number) => {
    playbackStore.setState({ volume });
    AudioBrowser.setVolume(volume);
  },
  overlay: {
    accessibilityLabelKey: "feat.playback.extra.volume" as const,
    icon: "volume-up-filled",
    formatValue: (val: number) => `${Math.round(val * 100)}%`,
  },
} as const;
//#endregion
