import type { DimensionValue } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { cssInterop } from "nativewind";

import { cn } from "@/lib/style";
import type { MediaType } from "./types";

// https://www.nativewind.dev/v4/api/css-interop
const Image = cssInterop(ExpoImage, { className: "style" });

/** @description Displays an image representing a media type. */
export default function MediaImage(props: {
  type: MediaType;
  imgSize: DimensionValue;
  imgSrc?: string;
  className?: string;
}) {
  const isArtist = props.type === "artist";
  const isSong = props.type === "song";
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
        { "bg-surface500": isSong, "rounded-full": isArtist },
        props.className,
      )}
    />
  );
}
