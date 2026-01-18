import { useNavigation } from "@react-navigation/native";
import TrackPlayer from "@weights-ai/react-native-track-player";
import type { ParseKeys } from "i18next";
import { useCallback, useImperativeHandle } from "react";
import { Pressable, View } from "react-native";

import { ActivityZone } from "~/resources/icons/ActivityZone";
import { Lyrics } from "~/resources/icons/Lyrics";
import { SlowMotionVideo } from "~/resources/icons/SlowMotionVideo";
import { Timer } from "~/resources/icons/Timer";
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
import { LyricSheet } from "./LyricSheet";
import { SleepTimerSheet } from "./SleepTimerSheet";

import { ScrollView } from "~/components/Defaults";
import { NumberStepper } from "~/components/Form/NumberStepper";
import { CachedSlider } from "~/components/Form/ReanimatedSlider";
import { SegmentedList } from "~/components/List/Segmented";
import { Marquee } from "~/components/Marquee";
import { DetachedSheet } from "~/components/Sheet/Detached";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { TStyledText } from "~/components/Typography/StyledText";
import { Switch } from "~/components/UI/Switch";
import { PlayingIndicator } from "~/modules/media/components/AnimatedBars";

export function PlaybackOptionsSheet(props: {
  ref: TrueSheetRef;
  trackId: string;
}) {
  const navigation = useNavigation();
  const playingSource = usePlaybackStore((s) => s.playingFrom);
  const sourceName = usePlaybackStore((s) => s.playingFromName);
  const playbackDelay = usePreferenceStore((s) => s.playbackDelay);
  const waveformSlider = usePreferenceStore((s) => s.waveformSlider);
  const playbackSpeed = useSessionStore((s) => s.playbackSpeed);
  const volume = useSessionStore((s) => s.volume);
  const internalSheetRef = useSheetRef();
  // @ts-expect-error - Should be able to synchronize refs.
  useImperativeHandle(props.ref, () => internalSheetRef.current);
  const appearanceSheetRef = useSheetRef();
  const lyricSheetRef = useSheetRef();
  const sleepTimerSheetRef = useSheetRef();

  const navigateToList = useCallback(async () => {
    if (!playingSource) return;
    await internalSheetRef.current?.dismiss();
    // Call `goBack()` to mimic `popTo` since we don't have access
    // to that function in the sheet.
    navigation.goBack();
    navigation.navigate(...getMediaLinkContext(playingSource));
  }, [navigation, internalSheetRef, playingSource]);

  const presentAppearanceSheet = useCallback(async () => {
    await internalSheetRef.current?.dismiss();
    appearanceSheetRef.current?.present();
  }, [appearanceSheetRef, internalSheetRef]);

  const presentLyricSheet = useCallback(async () => {
    await internalSheetRef.current?.dismiss();
    lyricSheetRef.current?.present();
  }, [lyricSheetRef, internalSheetRef]);

  const presentSleepTimerSheet = useCallback(async () => {
    await internalSheetRef.current?.dismiss();
    sleepTimerSheetRef.current?.present();
  }, [sleepTimerSheetRef, internalSheetRef]);

  return (
    <>
      <AppearanceSheet ref={appearanceSheetRef} />
      <LyricSheet ref={lyricSheetRef} trackId={props.trackId} />
      <SleepTimerSheet ref={sleepTimerSheetRef} />

      <DetachedSheet ref={internalSheetRef}>
        <ScrollView contentContainerClassName="gap-6">
          <SegmentedList.Item
            labelTextKey="term.playingFrom"
            supportingText={sourceName || "—"}
            onPress={navigateToList}
            disabled={!sourceName}
            LeftElement={<PlayingIndicator />}
            className="py-2 pl-2"
            _overflow={false}
          />
          <View className="flex-row gap-4">
            <CachedSlider
              initVal={playbackSpeed}
              {...PlaybackSpeedSliderOptions}
            />
            <CachedSlider initVal={volume} {...VolumeSliderOptions} />
          </View>

          <PreferenceRow
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
          <PreferenceRow
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
              labelTextKey="feat.lyrics.title"
              onPress={presentLyricSheet}
              LeftElement={<Lyrics />}
              className="gap-4"
            />
            <SegmentedList.Item
              labelTextKey="feat.sleepTimer.title"
              onPress={presentSleepTimerSheet}
              LeftElement={<Timer />}
              className="gap-4"
            />
          </SegmentedList>
        </ScrollView>
      </DetachedSheet>
    </>
  );
}

//#region Preference Row
function PreferenceRow(props: {
  labelKey: ParseKeys;
  RightElement: React.ReactNode;
}) {
  return (
    <View className="min-h-8 flex-row items-center justify-between gap-2">
      <Marquee color="surfaceBright">
        <TStyledText textKey={props.labelKey} bold className="text-sm" />
      </Marquee>
      {props.RightElement}
    </View>
  );
}
//#endregion

//#region Slider Configs
const rateFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

const PlaybackSpeedSliderOptions = {
  min: 0.25,
  max: 2,
  step: 0.05,
  height: 48,
  onChange: async (playbackSpeed: number) => {
    sessionStore.setState({ playbackSpeed });
    await TrackPlayer.setRate(playbackSpeed).catch();
  },
  overlay: {
    accessibilityLabelKey: "feat.playback.extra.speed" as const,
    Icon: SlowMotionVideo,
    formatValue: (val: number) => `${rateFormatter.format(val)}x`,
  },
  _className: "flex-1",
};

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
  _className: "flex-1",
};
//#endregion
