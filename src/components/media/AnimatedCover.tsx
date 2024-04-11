import { View, useWindowDimensions } from "react-native";
import Animated, { Keyframe, clamp } from "react-native-reanimated";

import { Disc } from "@/assets/svgs/Disc";

import { cn } from "@/lib/style";
import { MediaImage } from "./MediaImage";

type Props = {
  imgSrc: React.ComponentProps<typeof MediaImage>["imgSrc"];
  className?: string;
};

/** @description Simple pulling of viynl out of record animation. */
export function AnimatedCover({ imgSrc, className }: Props) {
  const { width, height } = useWindowDimensions();

  /*
    Automatically define the appropriate size of the cover based on the
    current screen size.
  */
  const imgSize = clamp(100, (width * 2) / 5, height / 5);

  return (
    <View
      style={{ height: imgSize }}
      className={cn("aspect-square w-full", className)}
    >
      <Animated.View
        entering={new Keyframe({
          0: { opacity: 0, translateX: 0 },
          1: { opacity: 1, translateX: 0 },
          100: { opacity: 1, translateX: imgSize / 2 },
        }).duration(300)}
        className="absolute left-0 top-0 opacity-0"
      >
        <Disc size={imgSize} />
      </Animated.View>
      <MediaImage
        type="track"
        imgSize={imgSize}
        imgSrc={imgSrc}
        className="rounded border-2 border-foreground50"
      />
    </View>
  );
}
