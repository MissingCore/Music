import { useNavigation } from "@react-navigation/native";
import TrackPlayer from "@weights-ai/react-native-track-player";
import { useCallback, useState } from "react";
import { Pressable } from "react-native";

import { ActivityZone } from "~/resources/icons/ActivityZone";
import { SlowMotionVideo } from "~/resources/icons/SlowMotionVideo";
import { VolumeUp } from "~/resources/icons/VolumeUp";
import { usePlaybackStore } from "~/stores/Playback/store";
import { usePreferenceStore } from "~/stores/Preference/store";
import {
  PreferenceSetters,
  PreferenceTogglers,
} from "~/stores/Preference/actions";
import { sessionStore, useSessionStore } from "~/services/SessionStore";

import { getMediaLinkContext } from "~/navigation/utils/router";
import { AppearanceSheet } from "./AppearanceSheet";
import { PlaybackSpeedSheet } from "./PlaybackSpeedSheet";

import { ScrollView } from "~/components/Defaults";
import { NumberStepper } from "~/components/Form/NumberStepper";
import { CachedSlider } from "~/components/Form/Slider";
import { SegmentedList } from "~/components/List/Segmented";
import { DetachedSheet } from "~/components/Sheet/Detached";
import { SheetLabelAction } from "~/components/Sheet/SheetLabelAction";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { Switch } from "~/components/UI/Switch";
import { PlayingIndicator } from "~/modules/media/components/AnimatedBars";

export function PlaybackOptionsSheet(props: {
  ref: TrueSheetRef;
  trackId: string;
}) {
  const navigation = useNavigation();
  const [stopDrag, setStopDrag] = useState(false);
  const playingSource = usePlaybackStore((s) => s.playingFrom);
  const sourceName = usePlaybackStore((s) => s.playingFromName);
  const playbackDelay = usePreferenceStore((s) => s.playbackDelay);
  const waveformSlider = usePreferenceStore((s) => s.waveformSlider);
  const showLyrics = useSessionStore((s) => s.showLyrics);
  const volume = useSessionStore((s) => s.volume);
  const appearanceSheetRef = useSheetRef();
  const playbackSpeedRef = useSheetRef();

  const navigateToList = useCallback(async () => {
    if (!playingSource) return;
    await props.ref.current?.dismiss();
    // Call `goBack()` to mimic `popTo` since we don't have access
    // to that function in the sheet.
    navigation.goBack();
    navigation.navigate(...getMediaLinkContext(playingSource));
  }, [navigation, props.ref, playingSource]);

  //#region Sheet Presenters
  const presentAppearanceSheet = useCallback(async () => {
    await props.ref.current?.dismiss();
    appearanceSheetRef.current?.present();
  }, [appearanceSheetRef, props.ref]);

  const presentPlaybackSheet = useCallback(async () => {
    await props.ref.current?.dismiss();
    playbackSpeedRef.current?.present();
  }, [playbackSpeedRef, props.ref]);
  //#endregion

  return (
    <>
      <AppearanceSheet ref={appearanceSheetRef} />
      <PlaybackSpeedSheet ref={playbackSpeedRef} />

      <DetachedSheet
        ref={props.ref}
        draggable={!stopDrag}
        contentContainerClassName="pb-0"
      >
        <ScrollView contentContainerClassName="gap-6 pb-4">
          <SegmentedList.Item
            labelTextKey="term.playingFrom"
            supportingText={sourceName || "—"}
            onPress={navigateToList}
            disabled={!sourceName}
            LeftElement={<PlayingIndicator />}
            className="py-2 pl-2"
            _overflow={false}
          />
          <CachedSlider
            initValue={volume}
            getInteractionStatus={setStopDrag}
            {...VolumeSliderOptions}
          />

          <SheetLabelAction
            labelKey="feat.playback.extra.delay"
            RightElement={
              <NumberStepper
                value={playbackDelay}
                onChange={PreferenceSetters.updatePlaybackDelayByDelta}
                min={0}
                max={10}
                suffix="s"
              />
            }
          />
          <SheetLabelAction
            labelKey="feat.lyrics.title"
            RightElement={
              <Pressable
                onPress={toggleLyricsView}
                className="h-8 justify-center"
              >
                <Switch enabled={showLyrics} />
              </Pressable>
            }
          />
          <SheetLabelAction
            labelKey="feat.waveformSlider.title"
            RightElement={
              <Pressable
                onPress={PreferenceTogglers.toggleWaveformSlider}
                className="h-8 justify-center"
              >
                <Switch enabled={waveformSlider} />
              </Pressable>
            }
          />

          <SegmentedList>
            <SegmentedList.Item
              labelTextKey="feat.appearance.title"
              onPress={presentAppearanceSheet}
              LeftElement={<ActivityZone />}
              className="gap-4"
            />
            <SegmentedList.Item
              labelTextKey="feat.playback.extra.speed"
              onPress={presentPlaybackSheet}
              LeftElement={<SlowMotionVideo />}
              className="gap-4"
            />
          </SegmentedList>
        </ScrollView>
      </DetachedSheet>
    </>
  );
}

//#region Slider Configs
const VolumeSliderOptions = {
  min: 0,
  max: 1,
  step: 0.01,
  height: 48,
  onChange: async (volume: number) => {
    sessionStore.setState({ volume });
    await TrackPlayer.setVolume(volume).catch();
  },
  overlay: {
    accessibilityLabelKey: "feat.playback.extra.volume" as const,
    Icon: VolumeUp,
    formatValue: (val: number) => `${Math.round(val * 100)}%`,
  },
};
//#endregion

//#region Helpers
function toggleLyricsView() {
  sessionStore.setState((prev) => ({ showLyrics: !prev.showLyrics }));
}
//#endregion
