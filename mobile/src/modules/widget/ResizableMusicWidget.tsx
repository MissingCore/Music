import {
  FlexWidget,
  ImageWidget,
  OverlapWidget,
  TextWidget,
} from "react-native-android-widget";

import type { WidgetBaseProps } from "./types";

type WidgetProps = WidgetBaseProps & {
  height: number;
  width: number;
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
        imageWidth={width}
      />
    </OverlapWidget>
  );
}

export function ResizeableMusicWidget(props: WidgetProps) {
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
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 24,
      }}
    >
      <TextWidget
        text={props.track.title}
        style={{
          fontSize: 32,
          fontFamily: "Inter-Regular",
          color: "#000000",
        }}
      />
      <Artwork
        artwork={props.track.artwork}
        height={props.height}
        width={props.width / 4}
      />
    </FlexWidget>
  );
}
