// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import BackgroundTimer from "@boterop/react-native-background-timer";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  LinearTransition,
  SlideInDown,
  SlideOutDown,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { getArtistsString } from "~/data/artist/utils";
import { usePlaybackStore } from "~/stores/Playback/store";
import { PlaybackControls } from "~/stores/Playback/actions";
import { usePreferenceStore } from "~/stores/Preference/store";
import { MiniplayerOffset, useIsMiniplayerVisible } from "./useBottomActions";

import { Swipeable } from "~/components/Swipeable";
import { IconButton } from "~/components/next/base/button-icon";
import { Ripple } from "~/components/next/base/ripple";
import { Text } from "~/components/next/base/typography";
import { Marquee } from "~/components/next/blocks/marquee";
import { MediaImage } from "~/components/next/blocks/media-image";
import {
  NextButton,
  PreviousButton,
} from "~/modules/media/components/MediaControls";

/** Container rendering the miniplayer, accounting for the toolbar. */
export function MiniplayerProvider() {
  const isMiniplayerRendered = useIsMiniplayerVisible();
  return (
    <Animated.View
      layout={LinearTransition}
      pointerEvents="box-none"
      className="absolute bottom-safe-offset-14 left-0 w-full items-end p-4 pt-0"
    >
      {isMiniplayerRendered ? <Miniplayer /> : null}
    </Animated.View>
  );
}

//#region Miniplayer
function Miniplayer() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const resetPlaybackStore = usePlaybackStore((s) => s.reset);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const track = usePlaybackStore((s) => s.activeTrack);
  const gestureUI = usePreferenceStore((s) => s.miniplayerGestures);
  const dragClearPlayback = usePreferenceStore((s) => s.dragClearPlayback);

  const TextWrapper = useMemo(
    () => (gestureUI ? Swipeable : View),
    [gestureUI],
  );

  //#region Drag to Reset Playback Store
  const panAmount = useSharedValue(0);

  const onResetStore = useCallback(() => {
    resetPlaybackStore();
    BackgroundTimer.setTimeout(() => panAmount.set(0), 1000);
  }, [panAmount, resetPlaybackStore]);

  const panGesture = usePanGesture({
    enabled: dragClearPlayback,
    // Only register for vertical pan, allowing swipe gesture to work.
    activeOffsetY: [-10, 10],
    onUpdate: ({ translationY }) => panAmount.set(Math.max(0, translationY)),
    onDeactivate: ({ velocityY }) => {
      //? Resetting the playback store is based off pan velocity.
      const metThreshold = velocityY > 500;
      panAmount.set(withSpring(metThreshold ? insets.bottom + 256 : 0));
    },
  });

  useAnimatedReaction(
    () => panAmount.get(),
    (currVal, prevVal) => {
      const threshold = insets.bottom + MiniplayerOffset;
      if (currVal > threshold && (prevVal === null || prevVal < threshold)) {
        scheduleOnRN(onResetStore);
      }
    },
  );

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateY: panAmount.get() }],
  }));
  //#endregion

  if (!track) return null;
  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        layout={LinearTransition}
        entering={SlideInDown}
        exiting={SlideOutDown}
        style={animatedStyles}
        className="z-10 w-full overflow-hidden rounded-full bg-surfaceContainerLowest"
      >
        <Ripple
          onPress={() => navigation.navigate("NowPlaying")}
          className="relative h-14 flex-row items-center px-1"
        >
          <MediaImage size={48} src={track.artwork} className="rounded-full" />

          <TextWrapper
            activationThreshold={32}
            overshootSwipe={false}
            onSwipeLeft={PlaybackControls.next}
            onSwipeRight={PlaybackControls.prev}
            wrapperClassName="shrink grow justify-center overflow-hidden"
            className="w-full shrink bg-surfaceContainerLowest px-1.5"
          >
            <Marquee>
              <Text size="sm">{track.name}</Text>
            </Marquee>
            <Marquee>
              <Text muted size="xxs">
                {getArtistsString(track.artists)}
              </Text>
            </Marquee>
          </TextWrapper>

          <Animated.View
            layout={LinearTransition}
            className="flex-row items-center rtl:flex-row-reverse"
          >
            {!gestureUI ? <PreviousButton /> : null}
            <IconButton
              icon={isPlaying ? "pause-filled" : "play-arrow-filled"}
              accessibilityLabel={t(`term.${isPlaying ? "pause" : "play"}`)}
              onPress={() => PlaybackControls.playToggle()}
              size="lg"
              _iconColor="primary"
            />
            {!gestureUI ? <NextButton /> : null}
          </Animated.View>

          <TrackProgress duration={track.duration} />
        </Ripple>
      </Animated.View>
    </GestureDetector>
  );
}

function TrackProgress({ duration }: { duration: number }) {
  const position = usePlaybackStore((s) => s.lastPosition);
  const progressPercent = `${(position / duration) * 100}%` as const;

  return (
    <View className="absolute right-2 bottom-0 left-2 h-0.5 bg-surfaceContainerHigh">
      <Animated.View
        layout={LinearTransition}
        style={{ width: progressPercent }}
        className="h-full rounded-full bg-primary"
      />
    </View>
  );
}
//#endregion
