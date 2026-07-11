// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ClickActionProps, HexColor } from "react-native-android-widget";
import { ImageWidget } from "react-native-android-widget";

import { getImageUri } from "~/lib/file-system";
import { WidgetSVG } from "./WidgetSVG";

/** Displays image with placeholder fallback. */
export function WidgetArtwork({
  size,
  artwork,
  placeholderColor,
  ...props
}: ClickActionProps & {
  size: number;
  artwork?: string | null;
  placeholderColor: HexColor;
}) {
  const imgUri = getImageUri(artwork);
  const imageSize = !imgUri ? (size * 5) / 6 : size;

  if (!imgUri) {
    return (
      <WidgetSVG
        name="placeholder"
        size={imageSize}
        color={placeholderColor}
        {...props}
      />
    );
  }
  return (
    <ImageWidget
      // @ts-expect-error - We pass down a `file://` URI.
      image={imgUri}
      imageHeight={imageSize}
      imageWidth={imageSize}
      {...props}
    />
  );
}
