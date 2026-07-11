// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { Image as ExpoImage } from "expo-image";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import type { SupportedIconName } from "~/resources/icons";
import { Icon } from "~/resources/icons";
import { usePreferenceStore } from "~/stores/Preference/store";

import { cn } from "~/lib/style";
import { getImageUri } from "~/lib/file-system";
import type { MediaType } from "~/stores/Playback/types";

const Image = withUniwind(ExpoImage);

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
  const usedClasses = cn("rounded-lg bg-surfaceContainerHigh", className, {
    "rounded-full": type === "artist",
  });

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
      <PlaceholderImage
        icon="folder"
        size={size}
        fullSize={false}
        className={usedClasses}
      />
    );
  } else if (source === null) {
    if (noPlaceholder) {
      return (
        <View style={{ width: size, height: size }} className={usedClasses} />
      );
    } else {
      return (
        <PlaceholderImage
          icon={`glyph-${type === "artist" ? "face" : "music"}`}
          size={size}
          className={usedClasses}
        />
      );
    }
  }

  return (
    <Image
      source={Array.isArray(source) ? null : getImageUri(source)}
      contentFit={squareArtwork ? "cover" : "contain"}
      style={{ width: size, height: size }}
      className={usedClasses}
    />
  );
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
      {sources
        .slice(0, 4)
        .map((source, idx) =>
          source === null ? (
            noPlaceholder ? (
              <View key={idx} style={{ height: size / 2, width: size / 2 }} />
            ) : (
              <PlaceholderImage key={idx} icon="glyph-music" size={size / 2} />
            )
          ) : (
            <Image
              key={idx}
              source={getImageUri(source)}
              className="size-1/2"
            />
          ),
        )}
    </View>
  );
}

function PlaceholderImage(props: {
  icon: SupportedIconName;
  size: number;
  fullSize?: boolean;
  className?: string;
}) {
  const { size, fullSize = true } = props;
  return (
    <View
      style={fullSize ? undefined : { padding: size / 4 }}
      className={props.className}
    >
      <Icon
        name={props.icon}
        size={size / (fullSize ? 1 : 2)}
        color="placeholder"
      />
    </View>
  );
}
