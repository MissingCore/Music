import { Image as ExpoImage } from "expo-image";
import { cssInterop } from "nativewind";
import type { DimensionValue } from "react-native";

import { cn } from "@/lib/style";
import { SpecialPlaylists } from "@/features/playback/constants";
import type { Media } from "./types";
import { CollageImage } from "../ui/image";

// https://www.nativewind.dev/v4/api/css-interop
const Image = cssInterop(ExpoImage, { className: "style" });

export namespace MediaImage {
  export type ImageSource = string | null | CollageImage.Props["sources"];

  export interface Props {
    type: Media;
    size: DimensionValue;
    source: ImageSource;
    className?: string;
  }
}

/** Image representing some media. */
export function MediaImage({
  type,
  size,
  source,
  className,
}: MediaImage.Props) {
  // Display a collage if we receive an array with atleast 1 `source`.
  if (Array.isArray(source) && source.length > 0) {
    return <CollageImage sources={source} {...{ size, className }} />;
  }

  const displayedImg = Array.isArray(source)
    ? null
    : source === SpecialPlaylists.favorites
      ? require("@/resources/images/music-glyph.png")
      : source;

  return (
    <Image
      source={displayedImg}
      placeholder={
        type === "artist"
          ? require("@/resources/images/face-glyph.png")
          : require("@/resources/images/music-glyph.png")
      }
      style={{ width: size, height: size }}
      className={cn(
        "rounded-lg bg-surface800",
        {
          "bg-surface500": type === "track",
          "rounded-full": type === "artist",
          "bg-accent500": source === SpecialPlaylists.favorites,
        },
        className,
      )}
    />
  );
}
