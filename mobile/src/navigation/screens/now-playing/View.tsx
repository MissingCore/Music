// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import type { Track } from "~/data/track/types";
import { usePlaybackStore } from "~/stores/Playback/store";
import { usePreferenceStore } from "~/stores/Preference/store";
import { presentTrackSheet } from "~/stores/Session/actions";
import { toggleLyricVisibility } from "~/modules/lyric/core/actions";

import { Back } from "~/navigation/components/Back";
import { SeekbarContext } from "./helpers/Seekbar.context";
import { ArtworkSlot } from "./components/ArtworkSlot";
import { SeekBar } from "./components/SeekBar";
import { PlaybackOptionsSheet } from "./sheets/PlaybackOptionsSheet";
import { SleepTimerSheet } from "./sheets/SleepTimerSheet";
import { useSleepTimerStore } from "./sheets/SleepTimerSheet/store";

import { Pressable } from "~/components/Base/Pressable";
import { FilledIconButton, IconButton } from "~/components/Form/Button/Icon";
import { Marquee } from "~/components/Marquee";
import { SafeContainer } from "~/components/SafeContainer";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { StyledText } from "~/components/Typography/StyledText";
import { ArtistsLink } from "~/modules/media/components/ArtistsLink";
import {
  NextButton,
  PlayToggleButton,
  PreviousButton,
  RepeatButton,
  ShuffleButton,
} from "~/modules/media/components/MediaControls";
import { FavoriteButton } from "~/modules/media/components/Track";

export default function NowPlaying() {
  const track = usePlaybackStore((s) => s.activeTrack);
  if (!track) return <Back />;
  return (
    <SeekbarContext>
      <SafeContainer additionalTopOffset={56} className="flex-1 gap-8">
        <ArtworkSlot artwork={track.artwork} trackId={track.id} />
        <View className="-mt-8 gap-6 px-4">
          <Metadata track={track} />
          <SeekBar id={track.id} uri={track.uri} trackLength={track.duration} />
          <PlaybackControls />
        </View>
        <BottomAppBar trackId={track.id} />
      </SafeContainer>
    </SeekbarContext>
  );
}

//#region Metadata
function Metadata({ track }: { track: Track }) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <View className="flex-row items-center gap-4">
      <View className="shrink grow gap-1">
        <Marquee>
          <StyledText className="text-xl/[1.125]">{track.name}</StyledText>
        </Marquee>
        <ArtistsLink
          artists={track.artists}
          popStrategy="popScreen"
          className="text-sm/[1.125]"
        />
        {track.albumName ? (
          <Marquee>
            <Pressable
              onPress={() => navigation.popTo("Album", { id: track.albumId })}
            >
              <StyledText dim className="text-sm/[1.125]">
                {track.albumName}
              </StyledText>
            </Pressable>
          </Marquee>
        ) : null}
      </View>
      <View className="flex-row items-center gap-1">
        <FavoriteButton id={track.id} size="lg" />
        <IconButton
          icon="more-vert"
          accessibilityLabel={t("template.entrySeeMore", { name: track.name })}
          onPress={() => presentTrackSheet(track.id)}
          size="lg"
        />
      </View>
      {/*
        "Spacer" to prevent layout shift when missing album or artist name.
        There needs to be some content within the text to have the line height
        take effect.
      */}
      <View aria-hidden pointerEvents="none" className="-ml-4 w-0 gap-1">
        <StyledText className="text-xl/[1.125]"> </StyledText>
        <StyledText className="text-sm/[1.125]"> </StyledText>
        <StyledText className="text-sm/[1.125]"> </StyledText>
      </View>
    </View>
  );
}
//#endregion

//#region Playback Controls
function PlaybackControls() {
  return (
    <View className="mx-auto w-full max-w-96 flex-row items-center justify-between gap-2 rtl:flex-row-reverse">
      <ShuffleButton />
      <PreviousButton />
      <PlayToggleButton />
      <NextButton />
      <RepeatButton />
    </View>
  );
}
//#endregion

//#region Bottom App Bar
function BottomAppBar({ trackId }: { trackId: string }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const sleepTimerSheetRef = useSheetRef();
  const playbackOptionsSheetRef = useSheetRef();

  return (
    <>
      <SleepTimerSheet ref={sleepTimerSheetRef} />
      <PlaybackOptionsSheet ref={playbackOptionsSheetRef} trackId={trackId} />

      <View className="flex-row items-center justify-between gap-4 p-4 pt-2">
        <BackButton />
        <View className="flex-row items-center gap-1 rounded-full bg-surfaceContainerLowest">
          <SleepTimerButton
            present={() => sleepTimerSheetRef.current?.present()}
          />
          <FilledIconButton
            icon="lyrics"
            accessibilityLabel={t("feat.lyrics.title")}
            onPress={toggleLyricVisibility}
            size="lg"
          />
          <FilledIconButton
            icon="view-agenda"
            accessibilityLabel={t("term.upcoming")}
            onPress={() => navigation.navigate("Upcoming")}
            size="lg"
          />
          <FilledIconButton
            icon="more-horiz"
            accessibilityLabel={t("feat.playback.extra.options")}
            onPress={() => playbackOptionsSheetRef.current?.present()}
            size="lg"
          />
        </View>
      </View>
    </>
  );
}

function SleepTimerButton(props: { present: VoidFunction }) {
  const { t } = useTranslation();
  const sleepTimerActive = useSleepTimerStore((s) => s.endAt) !== null;
  return (
    <FilledIconButton
      icon="timer"
      accessibilityLabel={t("feat.sleepTimer.title")}
      onPress={props.present}
      className={
        sleepTimerActive ? "bg-secondary active:bg-secondaryDim" : undefined
      }
      size="lg"
      _iconColor={sleepTimerActive ? "onSecondary" : undefined}
    />
  );
}

/**
 * Conditionally render the back button in the bottom app bar if we're
 * using the `Vinyl (Legacy)` design.
 */
function BackButton() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const usedDesign = usePreferenceStore((s) => s.nowPlayingDesign);

  if (usedDesign !== "vinylOld") return <View />;
  return (
    <FilledIconButton
      icon="keyboard-arrow-down"
      accessibilityLabel={t("form.back")}
      onPress={() => navigation.goBack()}
      size="lg"
    />
  );
}
//#endregion
