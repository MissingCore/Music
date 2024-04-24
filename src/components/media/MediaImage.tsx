import { Image as ExpoImage } from "expo-image";
import { cssInterop } from "nativewind";
import type { DimensionValue } from "react-native";
import { View } from "react-native";

import { cn } from "@/lib/style";
import type { MediaType } from "./types";
import { SpecialPlaylists } from "@/features/playback/utils/trackList";

// https://www.nativewind.dev/v4/api/css-interop
const Image = cssInterop(ExpoImage, { className: "style" });

type Props = {
  type: MediaType;
  imgSize: DimensionValue;
  imgSrc: string | null | (string | null)[];
  className?: string;
};

/** @description Displays an image representing a media type. */
export function MediaImage({ type, imgSize, imgSrc, className }: Props) {
  if (imgSrc === SpecialPlaylists.favorites) {
    return (
      <Image
        source={require("@/assets/images/glyph/music.png")}
        contentFit="cover"
        style={{ width: imgSize, height: imgSize }}
        className={cn("rounded-lg bg-accent500", className)}
      />
    );
  } else if (Array.isArray(imgSrc) && imgSrc.length > 0) {
    // Display a collage image if we have more than 1 `imgSrc`.
    return <CollageImage srcs={imgSrc} {...{ imgSize, className }} />;
  }

  const isArtist = type === "artist";
  const isTrack = type === "track";
  const displayedImg = Array.isArray(imgSrc) ? null : imgSrc;

  return (
    <Image
      source={displayedImg}
      placeholder={
        isArtist
          ? require("@/assets/images/glyph/face.png")
          : require("@/assets/images/glyph/music.png")
      }
      contentFit="cover"
      style={{ width: imgSize, height: imgSize }}
      className={cn(
        "rounded-lg bg-surface800",
        { "bg-surface500": isTrack, "rounded-full": isArtist },
        className,
      )}
    />
  );
}

/** @description Displays a collage of up to 4 cover images in the same footprint. */
function CollageImage(props: {
  imgSize: DimensionValue;
  srcs: (string | null)[];
  className?: string;
}) {
  return (
    <View
      style={{ width: props.imgSize, height: props.imgSize }}
      className={cn(
        "flex-row flex-wrap overflow-hidden rounded-lg bg-surface800",
        props.className,
      )}
    >
      {props.srcs.slice(0, 4).map((imgSrc, idx) => (
        <Image
          key={idx}
          source={imgSrc}
          placeholder={require("@/assets/images/glyph/music.png")}
          contentFit="cover"
          className="size-1/2 bg-surface500"
        />
      ))}
    </View>
  );
}
