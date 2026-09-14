// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { getImageUri } from "~/lib/file-system";
import { cn } from "~/lib/style";
import { isRecord } from "~/utils/validation";
import type { SupportedIconName } from "../base/icon";
import { Icon } from "../base/icon";
import { Text } from "../base/typography";
import { Image } from "../primitive/image";

export type MediaImageSrc =
  | string
  | null
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
  const shared = {
    size: size,
    style: { width: size, height: size },
    className: cn("bg-surfaceContainerHigh", className),
  };

  if (Array.isArray(src)) {
    return <Collage src={src} noPlaceholder={noPlaceholder} {...shared} />;
  } else if (isRecord(src)) {
    const { type, value } = src;
    if (type === "icon") {
      return <PlaceholderIcon icon={value} fullSize={false} {...shared} />;
    }
    return <PlaceholderText str={value} {...shared} />;
  } else if (src === null) {
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
  noPlaceholder,
}: Omit<MediaImageProps, "src"> & { src: Array<string | null> }) {
  return (
    <View
      style={{ width: size, height: size }}
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
  const { icon, size, fullSize = true, className } = props;
  return (
    <View
      style={fullSize ? undefined : { padding: size / 4 }}
      className={className}
    >
      <Icon name={icon} size={size / (fullSize ? 1 : 2)} color="placeholder" />
    </View>
  );
}

/** Generate a `src` for a "Text" placeholder for `MediaImage`. */
export function createTextPlaceholder(str: string) {
  return { type: "str", value: str.replace(/s/g, "").slice(0, 2) } as const;
}

function PlaceholderText(props: {
  str: string;
  size: number;
  className?: string;
}) {
  const { str, size, className } = props;
  return (
    <View
      style={{ width: size, height: size }}
      className={cn("items-center justify-center", className)}
    >
      <Text
        intent="accent"
        center
        style={{ fontSize: size / 2, lineHeight: size / 2 }}
        className="text-placeholder"
      >
        {str}
      </Text>
    </View>
  );
}
//#endregion
