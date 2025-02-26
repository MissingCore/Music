import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View, useWindowDimensions } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { useMusicStore } from "~/modules/media/services/Music";
import { MusicControls } from "~/modules/media/services/Playback";
import { useUserPreferencesStore } from "~/services/UserPreferences";
import { useVinylSeekbar } from "./useVinylSeekbar";

import { MediaImage } from "~/modules/media/components/MediaImage";
import { Vinyl } from "~/modules/media/components/Vinyl";

/** Renders the artwork of the current playing track. */
export function NowPlayingArtwork(props: { artwork: string | null }) {
  const { width } = useWindowDimensions();
  const [areaHeight, setAreaHeight] = useState<number | null>(null);

  /* Get the height for the artwork that maximizes the space. */
  const size = useMemo(() => {
    if (areaHeight === null) return undefined;
    // Exclude the padding around the image depending on which measurement is used.
    return (areaHeight > width ? width : areaHeight) - 32;
  }, [areaHeight, width]);

  return (
    <View
      onLayout={({ nativeEvent }) => setAreaHeight(nativeEvent.layout.height)}
      className="flex-1 items-center justify-center pt-8"
    >
      {size !== undefined ? (
        <ArtworkPicker source={props.artwork} size={size} />
      ) : null}
    </View>
  );
}

type ArtworkProps = { source: string | null; size: number };

/** Determines which artwork is rendered. */
function ArtworkPicker(props: ArtworkProps) {
  const usedDesign = useUserPreferencesStore((state) => state.nowPlayingDesign);

  if (usedDesign === "plain") return <PlainArtwork {...props} />;
  else if (usedDesign === "vinyl") return <VinylSeekBar {...props} />;
  else if (usedDesign === "vinylOld") return <VinylLegacy {...props} />;
  return null;
}

/** Plain artwork design. */
function PlainArtwork(props: ArtworkProps) {
  const { t } = useTranslation();
  const isPlaying = useMusicStore((state) => state.isPlaying);
  return (
    <Pressable
      accessibilityLabel={t(`term.${isPlaying ? "pause" : "play"}`)}
      onPress={MusicControls.playToggle}
    >
      <MediaImage type="track" {...props} />
    </Pressable>
  );
}

/** Seekbar variant that uses the vinyl artwork. */
function VinylSeekBar(props: ArtworkProps) {
  const { initCenter, vinylStyle, seekGesture } = useVinylSeekbar();
  return (
    <GestureDetector gesture={seekGesture}>
      <Animated.View onLayout={initCenter} style={vinylStyle}>
        <Vinyl onPress={MusicControls.playToggle} {...props} />
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
        className="absolute left-0 top-0 z-10"
      >
        <MediaImage type="track" {...props} />
      </Animated.View>
    </View>
  );
}
