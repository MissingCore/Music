import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { usePlaybackStore } from "~/stores/Playback/store";
import { PlaybackControls } from "~/stores/Playback/actions";
import { usePreferenceStore } from "~/stores/Preference/store";
import { useVinylSeekbar } from "../helpers/useVinylSeekbar";

import { MediaImage } from "~/modules/media/components/MediaImage";
import { Vinyl } from "~/modules/media/components/Vinyl";

/**
 * Renders the artwork of the current playing track (with a minimum 16px
 * of padding around the artwork).
 */
export function NowPlayingArtwork(props: { artwork: string | null }) {
  const [size, setSize] = useState(0);
  const containerRef = useRef<View>(null);

  /* Calculate the size of the artwork that maximizes the space. */
  useLayoutEffect(() => {
    containerRef.current?.measure((_x, _y, width, height) => {
      // Exclude the padding around the image depending on which measurement is used.
      setSize((height > width ? width : height) - 32);
    });
  }, []);

  return (
    <View ref={containerRef} className="flex-1 items-center justify-center">
      <ArtworkPicker source={props.artwork} size={size} />
    </View>
  );
}

type ArtworkProps = { source: string | null; size: number };

/** Determines which artwork is rendered. */
function ArtworkPicker(props: ArtworkProps) {
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
  const { wrapperRef, isActive, initCenter, vinylStyle, seekGesture } =
    useVinylSeekbar();
  return (
    <GestureDetector gesture={seekGesture}>
      <Animated.View ref={wrapperRef} onLayout={initCenter} style={vinylStyle}>
        <Vinyl
          onPress={!isActive ? PlaybackControls.playToggle : undefined}
          {...props}
        />
      </Animated.View>
    </GestureDetector>
  );
}

/** Similar artwork design seen in v1, but with the new features. */
function VinylLegacy(props: ArtworkProps) {
  const coverPosition = useSharedValue(0);
  const coverStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: coverPosition.value }],
  }));
  return (
    <View
      onLayout={() => {
        coverPosition.value = withDelay(
          50,
          withTiming(-props.size / 2, { duration: 500 }),
        );
      }}
      className="relative"
    >
      <VinylSeekBar {...props} />
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
