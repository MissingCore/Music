import type { ClickActionProps } from "react-native-android-widget";
import { ImageWidget } from "react-native-android-widget";

/** Displays image with placeholder fallback. */
export function WidgetArtwork({
  size,
  artwork,
  ...props
}: ClickActionProps & {
  size: number;
  artwork: string | null;
}) {
  const imageSize = !artwork ? (size * 5) / 6 : size;
  return (
    <ImageWidget
      image={artwork ?? require("~/resources/images/music-glyph.png")}
      imageHeight={imageSize}
      imageWidth={imageSize}
      {...props}
    />
  );
}
