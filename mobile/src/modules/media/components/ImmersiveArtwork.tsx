
import { StyleSheet, View, Dimensions } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Mask,
  Rect,
  Stop,
  Image as SvgImage,
} from "react-native-svg";

import { getImageUri } from "~/lib/file-system";
import { useLyricStore } from "~/modules/lyric/core/store";

const { width, height } = Dimensions.get("screen");

const FADE_START = 0.45;
const ART_SCALE = 1.35;

// Opacity of the full-screen black overlay when lyrics are shown.
const LYRICS_SCRIM_OPACITY = 0.82;

type Props = {
  artwork: string | null;
};

export function ImmersiveArtwork({ artwork }: Props) {
  const showLyrics = useLyricStore((s) => s.visible);

  if (!artwork) return null;
  const uri = getImageUri(artwork);
  if (!uri) return null;

  const artHeight = width * ART_SCALE;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { width, height }]}>
      {/* Diffused base: blurred artwork, filling the screen. */}
      
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          backgroundColor: "rgba(0,0,0,0.25)",
        }}
      />

      {/* Sharp art on top, alpha-masked so it melts into the diffused base. */}
      <Svg
        width={width}
        height={artHeight}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <Defs>
          <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#fff" stopOpacity={1} />
            <Stop offset={FADE_START} stopColor="#fff" stopOpacity={1} />
            <Stop offset="1" stopColor="#fff" stopOpacity={0} />
          </LinearGradient>
          <Mask id="artMask">
            <Rect x="0" y="0" width={width} height={artHeight} fill="url(#fade)" />
          </Mask>
        </Defs>
        <SvgImage
          href={uri}
          x="0"
          y="0"
          width={width}
          height={artHeight}
          preserveAspectRatio="xMidYMid slice"
          mask="url(#artMask)"
        />
      </Svg>

      {/* Lyrics scrim: fades the whole background toward black so white
          lyric text stays legible. Artwork remains visible underneath. */}
      <View
        pointerEvents="none"
        style={[
          { position: "absolute",
            top: 0,
            left: 0,
            width,
            height,
            backgroundColor: "#000",
            opacity: showLyrics ? LYRICS_SCRIM_OPACITY : 0}, 
        ]}
      />
    </View>
  );
}