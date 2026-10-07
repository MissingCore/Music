// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import AudioBrowser from "react-native-audio-browser";

import { Icon } from "~/resources/icons";
import { playbackStore, usePlaybackStore } from "~/stores/Playback/store";
import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";
import { PlaybackDelayConfig } from "~/stores/Preference/utils";

import { getMediaLinkContext } from "~/navigation/utils/router";
import { AppearanceSheet } from "./AppearanceSheet";

import { NumberStepper } from "~/components/Form/NumberStepper";
import { NothingSlider } from "~/components/Form/Slider.variant";
import { SegmentedList } from "~/components/List/Segmented";
import { SheetLabelAction } from "~/components/Sheet/SheetLabelAction";
import type { SheetRef } from "~/components/next/base/sheet";
import { Sheet, useSheetRef } from "~/components/next/base/sheet";
import { PlayingIndicator } from "~/modules/media/components/AnimatedBars";

export function PlaybackOptionsSheet(props: {
  ref: SheetRef;
  trackId: string;
}) {
  const navigation = useNavigation();
  const [stopDrag, setStopDrag] = useState(false);
  const playingSource = usePlaybackStore((s) => s.playingFrom);
  const sourceName = usePlaybackStore((s) => s.playingFromName);
  const playbackDelay = usePreferenceStore((s) => s.playbackDelay);
  const volume = usePlaybackStore((s) => s.volume);
  const appearanceSheetRef = useSheetRef();

  const navigateToList = useCallback(async () => {
    if (!playingSource) return;
    await props.ref.current?.dismiss();
    // @ts-expect-error - `popTo` method works.
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

  return (
    <>
      <AppearanceSheet ref={appearanceSheetRef} />

      <Sheet ref={props.ref} draggable={!stopDrag}>
        <SegmentedList.Item
          labelText="term.playingFrom"
          supportingText={sourceName || "—"}
          onPress={navigateToList}
          disabled={!sourceName}
          Leading={<PlayingIndicator />}
          className="py-2 pl-2"
          _overflow={false}
        />
        <NothingSlider
          initValue={volume}
          getInteractionStatus={setStopDrag}
          {...VolumeSliderOptions}
        />

        <SheetLabelAction
          labelKey="feat.playback.extra.delay"
          Trailing={
            <NumberStepper
              value={playbackDelay}
              onChange={PreferenceSetters.updatePlaybackDelayByDelta}
              {...PlaybackDelayConfig.bound}
              suffix="s"
            />
          }
        />

        <SegmentedList>
          <SegmentedList.Item
            labelText="feat.appearance.title"
            onPress={presentAppearanceSheet}
            Leading={<Icon name="format-paint" />}
          />
          <SegmentedList.Item
            labelText="feat.audioEffects.title"
            onPress={navigateToAudioEffectsScreen}
            Leading={<Icon name="graphic-eq" />}
          />
        </SegmentedList>
      </Sheet>
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
