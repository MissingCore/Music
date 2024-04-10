import { Image as ExpoImage } from "expo-image";
import { cssInterop } from "nativewind";
import type { DimensionValue } from "react-native";

import { cn } from "@/lib/style";
import type { MediaType } from "./types";

// https://www.nativewind.dev/v4/api/css-interop
const Image = cssInterop(ExpoImage, { className: "style" });

/** @description Displays an image representing a media type. */
export function MediaImage(props: {
  type: MediaType;
  imgSize: DimensionValue;
  imgSrc?: string | null;
  className?: string;
}) {
  const isArtist = props.type === "artist";
  const isTrack = props.type === "track";
  return (
    <Image
      source={props.imgSrc}
      placeholder={
        isArtist
          ? require("@/assets/images/glyph/face.png")
          : require("@/assets/images/glyph/music.png")
      }
      contentFit="cover"
      style={{ maxWidth: props.imgSize }}
      className={cn(
        "aspect-square w-full rounded-lg bg-surface800",
        { "bg-surface500": isTrack, "rounded-full": isArtist },
        props.className,
      )}
    />
  );
}
