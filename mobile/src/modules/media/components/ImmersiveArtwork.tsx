import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Defs,
  LinearGradient,
  Mask,
  Rect,
  Stop,
  Image,
} from "react-native-svg";

import { getImageUri } from "~/lib/file-system";

const FADE_START = 0.45;

export function ImmersiveArtwork(props: {
  onPress?: () => Promise<void> | void;
  source: string | null;
  dimensions: { height: number; width: number };
}) {
  const { top } = useSafeAreaInsets();
  if (!props.source) return null;
  const uri = getImageUri(props.source);
  if (!uri) return null;

  const width = props.dimensions.width;
  const artHeight = props.dimensions.height + 96;

  return (
    <View style={{ top: -top }} className="absolute inset-0">
      <Svg width={width} height={artHeight} className="absolute inset-0">
        <Defs>
          <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#fff" stopOpacity={1} />
            <Stop offset={FADE_START} stopColor="#fff" stopOpacity={1} />
            <Stop offset="1" stopColor="#fff" stopOpacity={0} />
          </LinearGradient>
          <Mask id="artMask">
            <Rect width={width} height={artHeight} fill="url(#fade)" />
          </Mask>
        </Defs>
        <Image
          href={uri}
          width={width}
          height={artHeight}
          preserveAspectRatio="xMidYMid slice"
          mask="url(#artMask)"
          onPress={props.onPress}
        />
      </Svg>
    </View>
  );
}
