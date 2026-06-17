import BackgroundTimer from "@boterop/react-native-background-timer";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
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
import { BottomActionsOffset } from "./useBottomActions";

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

/**
 * Displays a player that appears at the bottom of the screen if we have
 * a song loaded.
 */
export function MiniPlayer() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const resetPlaybackStore = usePlaybackStore((s) => s.reset);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const track = usePlaybackStore((s) => s.activeTrack);
  const gestureUI = usePreferenceStore((s) => s.miniplayerGestures);
  const dragClearPlayback = usePreferenceStore((s) => s.dragClearPlayback);
  const [isPressed, setIsPressed] = useState(false);

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
      const threshold = insets.bottom + BottomActionsOffset;
      if (currVal > threshold && (prevVal === null || prevVal < threshold)) {
        scheduleOnRN(onResetStore);
      }
    },
  );

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateY: panAmount.get() }],
  }));
  //#endregion

  if (!track) {
    if (isPressed) setIsPressed(false); // Since `onPressOut` won't get called if this gets hidden.
    return null;
  }
  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        layout={LinearTransition}
        entering={SlideInDown}
        exiting={SlideOutDown}
        style={animatedStyles}
        className={cn(
          "relative z-10 h-14 w-full shrink grow overflow-hidden rounded-full bg-surfaceContainerLowest",
          { "bg-surfaceContainerLow": isPressed },
        )}
      >
        <Pressable
          onPressIn={() => setIsPressed(true)}
          onPress={() => navigation.navigate("NowPlaying")}
          onPressOut={() => setIsPressed(false)}
          className="h-14 flex-row items-center px-1"
        >
          <MediaImage
            type="track"
            size={48}
            source={track.artwork}
            className="rounded-full"
          />

          <TextWrapper
            activationThreshold={32}
            overshootSwipe={false}
            onSwipeLeft={PlaybackControls.next}
            onSwipeRight={PlaybackControls.prev}
            wrapperClassName="shrink grow justify-center overflow-hidden"
            className={cn({
              "mx-1.5 shrink grow": !gestureUI,
              "bg-surfaceContainerLowest px-1.5": gestureUI,
              "bg-surfaceContainerLow": gestureUI && isPressed,
            })}
          >
            <Marquee color={`surfaceContainerLow${!isPressed ? "est" : ""}`}>
              <StyledText className="text-sm">{track.name}</StyledText>
            </Marquee>
            <Marquee color={`surfaceContainerLow${!isPressed ? "est" : ""}`}>
              <StyledText dim className="text-xxs">
                {getArtistsString(track.artists)}
              </StyledText>
            </Marquee>
          </TextWrapper>

          <Animated.View
            layout={LinearTransition}
            style={{ flexDirection: OnRTL.decide("row-reverse", "row") }}
            className="items-center"
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
    <View className="absolute right-2 bottom-0 left-2 h-0.5 bg-surfaceContainerHigh">
      <Animated.View
        layout={LinearTransition}
        style={{ width: progressPercent }}
        className="h-full rounded-full bg-primary"
      />
    </View>
  );
}
