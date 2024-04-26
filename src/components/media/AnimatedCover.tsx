import { View, useWindowDimensions } from "react-native";
import Animated, { Keyframe, clamp } from "react-native-reanimated";

import { Disc } from "@/assets/svgs/Disc";

import type { ImageSource } from "./MediaImage";
import { MediaImage } from "./MediaImage";

/** @description Keyframe for having the vinyl slide out from the right. */
const SlideOutRight = (imgSize: number, delay: number) =>
  new Keyframe({
    0: { opacity: 0, translateX: 0 },
    1: { opacity: 1, translateX: 0 },
    100: { opacity: 1, translateX: imgSize / 2 },
  })
    .duration(300)
    .delay(delay);

/** @description Keyframe for having the vinyl slide out from the bottom. */
const SlideOutBottom = (imgSize: number, delay: number) =>
  new Keyframe({
    0: { opacity: 0, translateY: 0 },
    1: { opacity: 1, translateY: 0 },
    100: { opacity: 1, translateY: imgSize * 0.45 },
  })
    .duration(300)
    .delay(delay);

/** @description Simple pulling of vinyl out of record animation. */
export function AnimatedCover(props: {
  type?: "right" | "bottom";
  delay?: number;
  source: ImageSource;
  className?: string;
}) {
  const { width, height } = useWindowDimensions();
  const type = props.type ?? "right";
  const delay = props.delay ?? 0;

  /*
    Automatically define the appropriate size of the cover based on the
    current screen size.
  */
  const imgSize =
    type === "right"
      ? clamp(100, (width * 2) / 5, height / 5)
      : clamp(200, (height * 2) / 7, (width * 2) / 3);

  return (
    <View
      style={{ marginBottom: type === "bottom" ? imgSize * 0.45 : 0 }}
      className={props.className}
    >
      <Animated.View
        entering={
          type === "right"
            ? SlideOutRight(imgSize, delay)
            : SlideOutBottom(imgSize, delay)
        }
        className="absolute left-0 top-0 opacity-0"
      >
        <Disc size={imgSize} />
      </Animated.View>
      <MediaImage
        type="track"
        size={imgSize}
        source={props.source}
        className="rounded border-2 border-foreground50"
      />
    </View>
  );
}
