import type { ClickActionProps } from "react-native-android-widget";
import { ImageWidget } from "react-native-android-widget";

import type { PlayerWidgetData, WithDimensions } from "./types";
import { WidgetBaseLayout } from "./components/WidgetBaseLayout";

type WidgetProps = WithDimensions<PlayerWidgetData & { openApp?: boolean }>;

export function NowPlayingWidget(props: WidgetProps) {
  const size = Math.min(props.width, props.height);

  return (
    <WidgetBaseLayout height={props.height} width={props.width}>
      <Artwork size={size} artwork={null} />
    </WidgetBaseLayout>
  );
}

//#region Layout Helpers
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
