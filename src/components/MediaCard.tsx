import type { DimensionValue } from "react-native";
import { Text, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { cssInterop } from "nativewind";

import { cn } from "@/lib/style";

// https://www.nativewind.dev/v4/api/css-interop
const Image = cssInterop(ExpoImage, { className: "style" });

type Props = {
  type: "artist" | "album" | "playlist" | "song";
  imgSrc?: string;
  imgSize: DimensionValue;
  title?: string;
  subTitle?: string;
  extra?: string;
};

/** @description Displays an Album, Artist, Playlist, or Song card. */
export default function MediaCard({ imgSize, imgSrc, type, ...text }: Props) {
  const isArtist = type === "artist";
  const isSong = type === "song";

  return (
    <View style={{ maxWidth: imgSize }} className="w-full">
      <Image
        source={imgSrc}
        placeholder={
          isArtist
            ? require("@/assets/images/glyph/face.png")
            : require("@/assets/images/glyph/music.png")
        }
        contentFit="cover"
        className={cn("aspect-square w-full rounded-lg bg-surface800", {
          "bg-surface500": isSong,
          "rounded-full": isArtist,
        })}
      />
      <View className="px-1">
        <MediaText
          content={text.title}
          className="mt-0.5 font-geistMono text-base text-foreground50"
        />
        <View className="flex-row justify-between gap-1">
          <MediaText
            content={text.subTitle}
            className="flex-1 font-geistMonoLight text-xs text-foreground100"
          />
          <MediaText
            noPlaceholder
            content={text.extra}
            className="shrink-0 font-geistMonoLight text-xs text-foreground100"
          />
        </View>
      </View>
    </View>
  );
}

type MediaTextProps = {
  content?: string;
  className?: string;
  noPlaceholder?: boolean;
};

/** @description Renders text with placeholder. */
function MediaText({ content, className, noPlaceholder }: MediaTextProps) {
  if (!content && noPlaceholder) return null;
  return (
    <Text numberOfLines={1} className={className}>
      {content || "Nothing"}
    </Text>
  );
}
