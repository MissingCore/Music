import { Image as ExpoImage } from "expo-image";
import { cssInterop } from "nativewind";
import type { DimensionValue } from "react-native";
import { View } from "react-native";

import { cn } from "@/lib/style";
import { SpecialPlaylists } from "@/features/playback/constants";
import type { Media } from "./types";

// https://www.nativewind.dev/v4/api/css-interop
const Image = cssInterop(ExpoImage, { className: "style" });

export type ImageSource = string | null | Array<string | null>;

export type MediaImageProps = {
  type: Media;
  size: DimensionValue;
  source: ImageSource;
  className?: string;
};

/** @description Image representing some media. */
export function MediaImage({ type, size, source, className }: MediaImageProps) {
  if (source === SpecialPlaylists.favorites) {
    return (
      <Image
        source={require("@/assets/images/glyph/music.png")}
        contentFit="cover"
        style={{ width: size, height: size }}
        className={cn("rounded-lg bg-accent500", className)}
      />
    );
  } else if (Array.isArray(source) && source.length > 0) {
    // Display a collage image if we recieve an array with atleast 1 `source`.
    return <CollageImage sources={source} {...{ size, className }} />;
  }

  const isArtist = type === "artist";
  const isTrack = type === "track";
  const displayedImg = Array.isArray(source) ? null : source;

  return (
    <Image
      source={displayedImg}
      placeholder={
        isArtist
          ? require("@/assets/images/glyph/face.png")
          : require("@/assets/images/glyph/music.png")
      }
      contentFit="cover"
      style={{ width: size, height: size }}
      className={cn(
        "rounded-lg bg-surface800",
        { "bg-surface500": isTrack, "rounded-full": isArtist },
        className,
      )}
    />
  );
}

/** @description Collage of up to 4 images in the same footprint. */
function CollageImage(props: {
  size: DimensionValue;
  sources: Array<string | null>;
  className?: string;
}) {
  return (
    <View
      style={{ width: props.size, height: props.size }}
      className={cn(
        "flex-row flex-wrap overflow-hidden rounded-lg bg-surface800",
        props.className,
      )}
    >
      {props.sources.slice(0, 4).map((source, idx) => (
        <Image
          key={idx}
          source={source}
          placeholder={require("@/assets/images/glyph/music.png")}
          contentFit="cover"
          className="size-1/2 bg-surface500"
        />
      ))}
    </View>
  );
}
