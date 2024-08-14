import { Image as ExpoImage } from "expo-image";
import { cssInterop } from "nativewind";
import type { DimensionValue } from "react-native";
import { View } from "react-native";

import { cn } from "@/lib/style";

// https://www.nativewind.dev/v4/api/css-interop
const Image = cssInterop(ExpoImage, { className: "style" });

export namespace CollageImage {
  export interface Props {
    size: DimensionValue;
    sources: Array<string | null>;
    className?: string;
  }
}

/** Collage of up to 4 images. */
export function CollageImage({ size, sources, className }: CollageImage.Props) {
  return (
    <View
      style={{ width: size, height: size }}
      className={cn(
        "flex-row flex-wrap overflow-hidden rounded-lg bg-surface800",
        className,
      )}
    >
      {sources.slice(0, 4).map((source, idx) => (
        <Image
          key={idx}
          source={source}
          // FIXME: Currently hard-coded a placeholder image — should replace.
          placeholder={require("@/resources/images/music-glyph.png")}
          className="size-1/2"
        />
      ))}
    </View>
  );
}
