// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ImageStyle } from "react-native";
import { View } from "react-native";

import { getImageUri } from "~/lib/file-system";
import { cn } from "~/lib/style";
import type { Maybe } from "~/utils/types";
import { isRecord } from "~/utils/validation";
import { useColor } from "~/modules/customization/theme/core/context";
import type { SupportedIconName } from "../base/icon";
import { Icon } from "../base/icon";
import { Image } from "../primitive/image";
import { Text } from "../themed/typography";

export type MediaImageSrc =
  | Maybe<string>
  | Array<string | null>
  | { type: "icon"; value: SupportedIconName }
  | { type: "str"; value: string };

interface MediaImageProps {
  src: MediaImageSrc;
  size: number;
  className?: string;
  noPlaceholder?: boolean;
}

export function MediaImage({
  src,
  size,
  className,
  noPlaceholder,
}: MediaImageProps) {
  const backgroundColor = useColor(
    noPlaceholder ? "primary" : "surfaceContainerHigh",
  );
  const shared = {
    size: size,
    style: { width: size, height: size, backgroundColor },
    className: cn("rounded-xl", className),
  };

  if (Array.isArray(src)) {
    return <Collage src={src} noPlaceholder={noPlaceholder} {...shared} />;
  } else if (isRecord(src)) {
    const { type, value } = src;
    if (type === "icon") {
      return <PlaceholderIcon icon={value} fullSize={false} {...shared} />;
    }
    return <PlaceholderText str={value} {...shared} />;
  } else if (!src) {
    if (noPlaceholder) return <View {...shared} />;
    return <PlaceholderIcon icon="glyph-music" {...shared} />;
  }

  return <Image source={getImageUri(src)} {...shared} />;
}

//#region Collage
function Collage({
  size,
  src,
  className,
  style,
  noPlaceholder,
}: Omit<MediaImageProps, "src"> & {
  src: Array<string | null>;
  style: ImageStyle;
}) {
  return (
    <View
      style={style}
      className={cn("flex-row flex-wrap overflow-hidden", className)}
    >
      {src
        .slice(0, 4)
        .map((source, idx) =>
          source ? (
            <Image
              key={idx}
              source={getImageUri(source)}
              className="size-1/2"
            />
          ) : noPlaceholder ? (
            <View key={idx} style={{ height: size / 2, width: size / 2 }} />
          ) : (
            <PlaceholderIcon key={idx} icon="glyph-music" size={size / 2} />
          ),
        )}
    </View>
  );
}
//#endregion

//#region Placeholders
function PlaceholderIcon(props: {
  icon: SupportedIconName;
  size: number;
  fullSize?: boolean;
  className?: string;
}) {
  const backgroundColor = useColor("surfaceContainerHigh");
  const { icon, size, fullSize = true, className } = props;
  return (
    <Icon
      name={icon}
      size={size / (fullSize ? 1 : 2)}
      color="placeholder"
      style={{ backgroundColor, ...(fullSize ? {} : { padding: size / 4 }) }}
      className={className}
    />
  );
}

/** Generate a `src` for a "Text" placeholder for `MediaImage`. */
export function createTextPlaceholder(str: string | undefined, long = false) {
  let sanitizedStr = (str ?? "").replace(/\s/g, "");
  if (!long) sanitizedStr = sanitizedStr.slice(0, 2);
  return { type: "str", value: sanitizedStr } as const;
}

function PlaceholderText(props: {
  str: string;
  size: number;
  className: string;
  style: ImageStyle;
}) {
  const { str, size, className, style } = props;

  const textSize = size / (str.length > 2 ? 4 : 2);

  return (
    <View
      style={style}
      className={cn("items-center justify-center", className)}
    >
      <Text
        accent
        center
        numberOfLines={1}
        ellipsizeMode="clip"
        color="placeholder"
        style={{ fontSize: textSize, lineHeight: textSize }}
        className="mt-1.5"
      >
        {str}
      </Text>
    </View>
  );
}
//#endregion
