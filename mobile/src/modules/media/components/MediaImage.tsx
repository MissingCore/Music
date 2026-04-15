import { Image as ExpoImage } from "expo-image";
import { useMemo } from "react";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import { Folder } from "~/resources/icons/Folder";
import { usePreferenceStore } from "~/stores/Preference/store";

import { cn } from "~/lib/style";
import type { MediaType } from "~/stores/Playback/types";
import { ReservedNames } from "../constants";

const Image = withUniwind(ExpoImage);

const MusicGlyph = require("~/resources/images/music-glyph.png");
const FaceGlyph = require("~/resources/images/face-glyph.png");

export namespace MediaImage {
  export type ImageSource = string | null | Array<string | null>;

  export type ImageContent = { type: MediaType; source: ImageSource };

  export type ImageConfig = {
    size: number;
    className?: string;
    noPlaceholder?: boolean;
  };

  export type Props = ImageContent & ImageConfig;
}

/** Image representing some media. */
export function MediaImage({
  type,
  size,
  source,
  className,
  noPlaceholder,
}: MediaImage.Props) {
  const squareArtwork = usePreferenceStore((s) => s.squareArtwork);
  const usedClasses = cn("rounded-lg bg-surfaceContainerHigh", className);

  const [RenderedEl, additionalProps] = useMemo(() => {
    const imgSource = getUsedImage({ source, type, noPlaceholder });
    if (!imgSource && noPlaceholder) return [View, {}];

    let placeholder = type === "artist" ? FaceGlyph : MusicGlyph;
    if (noPlaceholder) placeholder = undefined;
    return [Image, { source: imgSource, placeholder }];
  }, [source, type, noPlaceholder]);

  //? We shouldn't ever recieve an empty array due to our API function handling this case for us.
  if (type === "playlist" && Array.isArray(source)) {
    return (
      <CollageImage
        sources={source}
        size={size}
        className={usedClasses}
        noPlaceholder={noPlaceholder}
      />
    );
  } else if (type === "folder") {
    return (
      <View style={{ padding: size / 4 }} className={usedClasses}>
        <Folder size={size / 2} color="#FFFFFF" />
      </View>
    );
  }

  return (
    <RenderedEl
      {...additionalProps}
      contentFit={squareArtwork ? "cover" : "contain"}
      placeholderContentFit="cover"
      style={{ width: size, height: size }}
      className={cn(usedClasses, { "rounded-full": type === "artist" })}
    />
  );
}

/** Helper to return the correct image displayed in `<MediaImage />`. */
export function getUsedImage(args: {
  source: MediaImage.ImageSource;
  type: MediaType;
  noPlaceholder?: boolean;
}) {
  if (
    Array.isArray(args.source) ||
    args.source === null ||
    ReservedNames.has(args.source)
  ) {
    if (args.noPlaceholder) return null;
    if (args.type === "artist") return FaceGlyph;
    return MusicGlyph;
  }
  return args.source;
}

/** Only used to represent a playlist. */
function CollageImage({
  size,
  sources,
  className,
  noPlaceholder,
}: {
  sources: Exclude<MediaImage.ImageSource, string | null>;
} & MediaImage.ImageConfig) {
  return (
    <View
      style={{ width: size, height: size }}
      className={cn("flex-row flex-wrap overflow-hidden", className)}
    >
      {sources.slice(0, 4).map((source, idx) => (
        <Image
          key={idx}
          source={source}
          placeholder={noPlaceholder ? undefined : MusicGlyph}
          className="size-1/2"
        />
      ))}
    </View>
  );
}
