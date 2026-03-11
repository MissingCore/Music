import BackgroundTimer from "@boterop/react-native-background-timer";
import { useNavigation } from "@react-navigation/native";
import { atom, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { Pause } from "~/resources/icons/Pause";
import { PlayArrow } from "~/resources/icons/PlayArrow";
import { getArtistsString } from "~/data/artist/utils";
import { usePlaybackStore } from "~/stores/Playback/store";
import { PlaybackControls } from "~/stores/Playback/actions";
import { usePreferenceStore } from "~/stores/Preference/store";

import { useBottomActionsInset } from "../hooks/useBottomActions";

import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import { Pressable } from "~/components/Base/Pressable";
import { IconButton } from "~/components/Form/Button/Icon";
import { Marquee } from "~/components/Marquee";
import { Swipeable } from "~/components/Swipeable";
import { StyledText } from "~/components/Typography/StyledText";
import {
  NextButton,
  PreviousButton,
} from "~/modules/media/components/MediaControls";
import { MediaImage } from "~/modules/media/components/MediaImage";

/** Enables us to to do some logic before the reset function is called. */
export const visibleBeforeResetAtom = atom(false);

/**
 * Displays a player that appears at the bottom of the screen if we have
 * a song loaded.
 */
export function MiniPlayer({ hidden = false, stacked = false }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const bottomInsets = useBottomActionsInset();
  const resetPlaybackStore = usePlaybackStore((s) => s.reset);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const track = usePlaybackStore((s) => s.activeTrack);
  const gestureUI = usePreferenceStore((s) => s.miniplayerGestures);
  const dragClearPlayback = usePreferenceStore((s) => s.dragClearPlayback);
  const [isPressed, setIsPressed] = useState(false);

  //#region Bottom Actions Layout Animation
  const setVisibleBeforeReset = useSetAtom(visibleBeforeResetAtom);

  useEffect(() => {
    setVisibleBeforeReset(!!track);
  }, [track, setVisibleBeforeReset]);
  //#endregion

  const TextWrapper = useMemo(
    () => (gestureUI ? Swipeable : View),
    [gestureUI],
  );

  //#region Drag to Reset Playback Store
  const panAmount = useSharedValue(0);

  const onResetStore = useCallback(() => {
    resetPlaybackStore();
    BackgroundTimer.setTimeout(() => {
      panAmount.value = 0;
    }, 1000);
  }, [panAmount, resetPlaybackStore]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(dragClearPlayback)
        // Only register for vertical pan, allowing swipe gesture to work.
        .activeOffsetY([-1, 1])
        .onUpdate(({ translationY }) => {
          panAmount.value = Math.max(0, translationY);
        })
        .onEnd(({ velocityY }) => {
          //? Resetting the playback store is based off pan velocity.
          const metThreshold = velocityY > 1000;
          if (metThreshold) scheduleOnRN(setVisibleBeforeReset, false);
          panAmount.value = withSpring(metThreshold ? insets.bottom + 256 : 0);
        }),
    [panAmount, insets, dragClearPlayback, setVisibleBeforeReset],
  );

  useAnimatedReaction(
    () => panAmount.value,
    (curr, prev) => {
      const threshold = insets.bottom + bottomInsets.withNav;
      if (curr > threshold && (prev === null || prev < threshold)) {
        scheduleOnRN(onResetStore);
      }
    },
  );

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateY: panAmount.value }],
  }));
  //#endregion

  if (!track || hidden) {
    if (isPressed) setIsPressed(false); // Since `onPressOut` won't get called if this gets hidden.
    return null;
  }
  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={animatedStyles}
        className={cn(
          "z-10 overflow-hidden rounded-md bg-surfaceContainerLowest",
          { "rounded-b-xs": stacked, "bg-surfaceContainerLow": isPressed },
        )}
      >
        <Pressable
          onPressIn={() => setIsPressed(true)}
          onPress={() => navigation.navigate("NowPlaying")}
          onPressOut={() => setIsPressed(false)}
          className="flex-row items-center px-2"
        >
          <MediaImage
            type="track"
            size={48}
            source={track.artwork}
            className="mt-2 mb-1.5 rounded-xs"
          />

          <TextWrapper
            activationThreshold={32}
            overshootSwipe={false}
            onSwipeLeft={PlaybackControls.next}
            onSwipeRight={PlaybackControls.prev}
            wrapperClassName="shrink grow justify-center overflow-hidden"
            className={cn({
              "mx-2 shrink grow": !gestureUI,
              "bg-surfaceContainerLowest px-2": gestureUI,
              "bg-surfaceContainerLow": gestureUI && isPressed,
            })}
          >
            <Marquee color="surfaceContainerLowest">
              <StyledText>{track.name}</StyledText>
            </Marquee>
            <Marquee color="surfaceContainerLowest">
              <StyledText dim>{getArtistsString(track.artists)}</StyledText>
            </Marquee>
          </TextWrapper>

          <View
            style={{ flexDirection: OnRTL.decide("row-reverse", "row") }}
            className="items-center"
          >
            {!gestureUI ? <PreviousButton /> : null}
            <IconButton
              Icon={isPlaying ? Pause : PlayArrow}
              accessibilityLabel={t(`term.${isPlaying ? "pause" : "play"}`)}
              onPress={() => PlaybackControls.playToggle()}
              size="lg"
              _iconColor="primary"
            />
            {!gestureUI ? <NextButton /> : null}
          </View>
        </Pressable>
        <TrackProgress duration={track.duration} />
      </Animated.View>
    </GestureDetector>
  );
}

function TrackProgress({ duration }: { duration: number }) {
  const position = usePlaybackStore((s) => s.lastPosition);
  const progressPercent = `${(position / duration) * 100}%` as const;

  return (
    <View className="px-2">
      <View className="h-0.5 w-full rounded-full bg-surfaceContainerHigh">
        <View
          style={{ width: progressPercent }}
          className="h-full rounded-full bg-primary"
        />
      </View>
    </View>
  );
}
