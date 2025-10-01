import {
  FlexWidget,
  ImageWidget,
  OverlapWidget,
  TextWidget,
} from "react-native-android-widget";

import { BorderRadius } from "~/constants/Styles";
import type { WidgetBaseProps } from "./types";

type WidgetProps = WidgetBaseProps & {
  height: number;
  width: number;
  theme: Record<
    "canvas" | "surface" | "onSurface" | "foreground",
    `#${string}`
  >;
};

function Artwork({
  height,
  width,
  artwork,
}: {
  height: number;
  width: number;
  artwork: string | null;
}) {
  return (
    <OverlapWidget style={{ height, width }}>
      <ImageWidget
        image={artwork ?? require("~/resources/images/music-glyph.png")}
        imageHeight={height}
        imageWidth={height}
      />
    </OverlapWidget>
  );
}

export function MusicPlayerWidget(props: WidgetProps) {
  if (!props.track) {
    return (
      <FlexWidget
        style={{
          height: "match_parent",
          width: "match_parent",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#ffffff",
          borderRadius: 24,
        }}
      >
        <TextWidget
          text="No Track Found"
          style={{
            fontSize: 32,
            fontFamily: "Inter-Regular",
            color: "#000000",
          }}
        />
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        overflow: "hidden",
        backgroundColor: props.theme.canvas,
        borderRadius: BorderRadius.xl,
      }}
    >
      <Artwork
        artwork={props.track.artwork}
        height={props.height}
        width={props.width}
      />
    </FlexWidget>
  );
}
