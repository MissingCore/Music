// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useAtomValue } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { usePlaybackStore } from "~/stores/Playback/store";
import { PlaybackControls } from "~/stores/Playback/actions";
import { usePreferenceStore } from "~/stores/Preference/store";

import { isSeekingAtom } from "../helpers/Seekbar.context";
import { useVinylSeekbar } from "../helpers/useVinylSeekbar";

import { Pressable } from "~/components/Base/Pressable";
import { MediaImage } from "~/modules/media/components/MediaImage";
import { Vinyl } from "~/modules/media/components/Vinyl";

type ArtworkProps = {
  source: string | null;
  size: number;
  dimensions: { height: number; width: number };
};

/** Determines which artwork is rendered. */
export function ArtworkPicker(props: ArtworkProps) {
  const usedDesign = usePreferenceStore((s) => s.nowPlayingDesign);

  if (usedDesign === "plain") return <PlainArtwork {...props} />;
  else if (usedDesign === "vinyl") return <VinylSeekBar {...props} />;
  else if (usedDesign === "vinylOld") return <VinylLegacy {...props} />;
  return null;
}

/** Plain artwork design. */
function PlainArtwork(props: ArtworkProps) {
  const { t } = useTranslation();
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const enableTapGesture = usePreferenceStore(
    (s) => s.nowPlayingArtworkControls,
  );

  if (!enableTapGesture) return <MediaImage type="track" {...props} />;
  return (
    <Pressable
      accessibilityLabel={t(`term.${isPlaying ? "pause" : "play"}`)}
      onPress={() => PlaybackControls.playToggle()}
    >
      <MediaImage type="track" {...props} />
    </Pressable>
  );
}

/** Seekbar variant that uses the vinyl artwork. */
function VinylSeekBar(props: ArtworkProps) {
  const isSeeking = useAtomValue(isSeekingAtom);
  const enableTapGesture = usePreferenceStore(
    (s) => s.nowPlayingArtworkControls,
  );
  const { seekGesture, vinylWrapperArgs } = useVinylSeekbar();

  return (
    <GestureDetector gesture={seekGesture}>
      <Animated.View {...vinylWrapperArgs}>
        <Vinyl
          onPress={
            !isSeeking && enableTapGesture
              ? PlaybackControls.playToggle
              : undefined
          }
          {...props}
        />
      </Animated.View>
    </GestureDetector>
  );
}

/** Similar artwork design seen in v1, but with the new features. */
function VinylLegacy(props: ArtworkProps) {
  const [animationCompleted, setAnimationCompleted] = useState(0);
  const alternativeLayout =
    props.dimensions.width > props.dimensions.height * 1.5;

  const coverPosition = useSharedValue(0);
  const coverStyle = useAnimatedStyle(() => {
    if (alternativeLayout)
      return { transform: [{ translateX: coverPosition.get() / 2 }] };
    return { transform: [{ translateY: coverPosition.get() }] };
  });
  const vinylStyle = useAnimatedStyle(() => {
    if (alternativeLayout)
      return { transform: [{ translateX: -coverPosition.get() / 2 }] };
    return {};
  });

  return (
    <View
      onLayout={() =>
        coverPosition.set(
          withDelay(
            50,
            withTiming(-props.size / 2, { duration: 500 }, (finished) => {
              if (finished) scheduleOnRN(setAnimationCompleted, Date.now());
            }),
          ),
        )
      }
      className="relative"
    >
      <Animated.View style={vinylStyle}>
        <VinylSeekBar
          //? Key is to ensure that gesture measurements doesn't use "initial"
          //? position (ie: vinyl position before translation).
          key={animationCompleted}
          {...props}
        />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={coverStyle}
        className="absolute top-0 left-0 z-10"
      >
        <MediaImage type="track" {...props} />
      </Animated.View>
    </View>
  );
}
