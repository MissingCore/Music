import { View, useWindowDimensions } from "react-native";
import Animated, { SlideInLeft, clamp } from "react-native-reanimated";

import { Disc } from "@/assets/svgs/Disc";

import Colors from "@/constants/Colors";
import { cn } from "@/lib/style";
import { MediaImage } from "./MediaImage";

type Props = { imgSrc?: string | null; className?: string };

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
        entering={SlideInLeft.withInitialValues({
          originX: -imgSize / 2,
        }).duration(500)}
        className="absolute left-0 top-0 translate-x-1/2"
      >
        <Disc size={imgSize} color={Colors.foreground50} />
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
