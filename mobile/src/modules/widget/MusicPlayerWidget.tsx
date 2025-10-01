import type {
  ClickActionProps,
  FlexWidgetStyle,
} from "react-native-android-widget";
import { FlexWidget, ImageWidget } from "react-native-android-widget";

import { BorderRadius, Colors } from "~/constants/Styles";
import type { WidgetBaseProps } from "./types";

type WidgetProps = WidgetBaseProps & {
  height: number;
  width: number;
};

export function MusicPlayerWidget(props: WidgetProps) {
  const size = Math.min(props.width, props.height);

  if (!props.track) return <NotFoundWidget size={size} />;
  return (
    <WidgetAlignment>
      <SquareWidgetBase size={size}>
        <Artwork
          clickAction="PLAY_PAUSE"
          size={size}
          artwork={props.track.artwork}
        />
      </SquareWidgetBase>
    </WidgetAlignment>
  );
}

/** Default placeholder widget when we have no data. */
function NotFoundWidget({ size }: { size: number }) {
  return (
    <WidgetAlignment>
      <SquareWidgetBase
        clickAction="OPEN_APP"
        size={size}
        style={{ alignItems: "center", justifyContent: "center" }}
      >
        <Artwork size={size} artwork={null} />
      </SquareWidgetBase>
    </WidgetAlignment>
  );
}

//#region Layout Helpers
function WidgetAlignment(props: { children: React.ReactNode }) {
  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        alignItems: "center",
        justifyContent: "center",
      }}
      {...props}
    />
  );
}

function SquareWidgetBase({
  size,
  style,
  ...props
}: ClickActionProps & {
  size: number;
  children: React.ReactNode;
  style?: FlexWidgetStyle;
}) {
  return (
    <FlexWidget
      style={{
        overflow: "hidden",
        height: size,
        width: size,
        backgroundColor: Colors.neutral10,
        borderRadius: BorderRadius.xl,
        ...style,
      }}
      {...props}
    />
  );
}

function Artwork({
  size,
  artwork,
  ...props
}: ClickActionProps & { size: number; artwork: string | null }) {
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
//#endregion
