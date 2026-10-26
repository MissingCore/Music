// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import type { Track } from "~/data/track/types";
import { usePlaybackStore } from "~/stores/Playback/store";
import { usePreferenceStore } from "~/stores/Preference/store";
import { presentTrackSheet } from "~/stores/Session/actions";
import { toggleLyricStoreKey } from "~/modules/lyric/core/actions";
import { useAlternativeLayout } from "~/hooks/useAlternativeLayout";

import { Back } from "~/navigation/components/Back";
import { SeekbarContext } from "./helpers/Seekbar.context";
import { ArtworkSlot } from "./components/ArtworkSlot";
import { SeekBar } from "./components/SeekBar";
import { PlaybackOptionsSheet } from "./sheets/PlaybackOptionsSheet";
import { SleepTimerSheet } from "./sheets/SleepTimerSheet";
import { useSleepTimerStore } from "./sheets/SleepTimerSheet/store";

import { cn } from "~/lib/style";
import { Pressable } from "~/components/Base/Pressable";
import { FilledIconButton, IconButton } from "~/components/Form/Button/Icon";
import { useSheetRef } from "~/components/next/base/sheet";
import { Text } from "~/components/next/base/typography";
import { Marquee } from "~/components/next/blocks/marquee";
import { FavoriteButton } from "~/components/next/composed/track-item";
import { AtmosphereBackground } from "~/modules/customization/atmosphere/AtmosphereBackground";
import { ArtistsLink } from "~/modules/media/components/ArtistsLink";
import {
  NextButton,
  PlayToggleButton,
  PreviousButton,
  RepeatButton,
  ShuffleButton,
} from "~/modules/media/components/MediaControls";
import { PlaybackControlGestureWrapper } from "./components/PlaybackControlGestureWrapper";
import { useLyricStore } from "~/modules/lyric/core/store";

export default function NowPlaying() {
  const isLargeScreen = useAlternativeLayout();
  const track = usePlaybackStore((s) => s.activeTrack);
  //? `fullscreen = true` implies `visible = true`.
  const showFullscreenLyrics = useLyricStore((s) => s.fullscreen);
  const sleepTimerSheetRef = useSheetRef();
  const playbackOptionsSheetRef = useSheetRef();

  if (!track) return <Back />;
  return (
    <>
      <SleepTimerSheet ref={sleepTimerSheetRef} />
      <PlaybackOptionsSheet ref={playbackOptionsSheetRef} trackId={track.id} />

      <AtmosphereBackground source={track.artwork}>
        <View
          className={cn(
            "flex-1 py-safe",
            isLargeScreen ? "flex-row items-center" : "gap-8",
          )}
        >
          <SeekbarContext>
            <PlaybackControlGestureWrapper>
              <ArtworkSlot artwork={track.artwork} trackId={track.id} />
              <View
                className={cn(
                  "gap-6 px-4 pb-4",
                  isLargeScreen ? "max-w-1/2" : "-mt-4",
                )}
              >
                <Metadata track={track} />
                <SeekBar
                  id={track.id}
                  uri={track.uri}
                  trackLength={track.duration}
                />
                {(!showFullscreenLyrics || isLargeScreen) && (
                  <>
                    <PlaybackControls />
                    <BottomAppBar
                      presentSleepTimerSheet={() =>
                        sleepTimerSheetRef.current?.present()
                      }
                      presentPlaybackOptionsSheet={() =>
                        playbackOptionsSheetRef.current?.present()
                      }
                    />
                  </>
                )}
              </View>
            </PlaybackControlGestureWrapper>
          </SeekbarContext>
        </View>
      </AtmosphereBackground>
    </>
  );
}

//#region Metadata
function Metadata({ track }: { track: Track }) {
  const { t } = useTranslation();
  const navigation = useNavigation("NowPlaying");
  const alternativeLayout = usePreferenceStore((s) => s.alternativeInfoLayout);

  return (
    <View className="flex-row items-center gap-4">
      {alternativeLayout ? <FavoriteButton id={track.id} size="lg" /> : null}
      <View className="shrink grow gap-1">
        <Marquee center={alternativeLayout}>
          <Text className="text-xl/[1.125]">{track.name}</Text>
        </Marquee>
        <ArtistsLink
          artists={track.artists}
          popStrategy="popScreen"
          center={alternativeLayout}
          className="text-sm/[1.125]"
        />
        {track.albumName ? (
          <Marquee center={alternativeLayout}>
            <Pressable
              onPress={() => navigation.popTo("Album", { id: track.albumId! })}
            >
              <Text muted className="text-sm/[1.125]">
                {track.albumName}
              </Text>
            </Pressable>
          </Marquee>
        ) : null}
      </View>
      <View className="flex-row items-center gap-1">
        {!alternativeLayout ? <FavoriteButton id={track.id} size="lg" /> : null}
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
        <Text className="text-xl/[1.125]"> </Text>
        <Text className="text-sm/[1.125]"> </Text>
        <Text className="text-sm/[1.125]"> </Text>
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
function BottomAppBar(props: {
  presentSleepTimerSheet: VoidFunction;
  presentPlaybackOptionsSheet: VoidFunction;
}) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  return (
    <View className="flex-row items-center justify-between gap-4 pt-4">
      <BackButton />
      <View className="flex-row items-center gap-1 rounded-full bg-surfaceContainerLowest">
        <SleepTimerButton present={props.presentSleepTimerSheet} />
        <IconButton
          icon="lyrics"
          accessibilityLabel={t("feat.lyrics.title")}
          onPress={toggleLyricStoreKey("visible")}
          size="lg"
          _fullRipple
        />
        <IconButton
          icon="view-agenda"
          accessibilityLabel={t("term.upcoming")}
          onPress={() => navigation.navigate("Upcoming")}
          size="lg"
          _fullRipple
        />
        <IconButton
          icon="more-horiz"
          accessibilityLabel={t("feat.playback.extra.options")}
          onPress={props.presentPlaybackOptionsSheet}
          size="lg"
          _fullRipple
        />
      </View>
    </View>
  );
}

function SleepTimerButton(props: { present: VoidFunction }) {
  const { t } = useTranslation();
  const sleepTimerActive = useSleepTimerStore((s) => s.endAt) !== null;
  return (
    <IconButton
      icon="timer"
      accessibilityLabel={t("feat.sleepTimer.title")}
      onPress={props.present}
      size="lg"
      className={sleepTimerActive ? "bg-secondary" : undefined}
      rippleColor={sleepTimerActive ? "secondaryDim" : undefined}
      _iconColor={sleepTimerActive ? "onSecondary" : undefined}
      _fullRipple
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
