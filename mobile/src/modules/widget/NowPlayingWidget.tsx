import { OverlapWidget } from "react-native-android-widget";

import type { PlayerWidgetData, WithDimensions } from "./types";
import { WidgetDesign } from "./constants";
import { WidgetArtwork } from "./components/WidgetArtwork";
import { WidgetBaseLayout } from "./components/WidgetBaseLayout";
import { WidgetCell } from "./components/WidgetCell";

type WidgetProps = WithDimensions<PlayerWidgetData & { openApp?: boolean }>;

export function NowPlayingWidget(props: WidgetProps) {
  const size = Math.min(props.width, props.height);

  const cellSize = (size - WidgetDesign.layoutGap) / 2;

  return (
    <WidgetBaseLayout height={size} width={size} transparent>
      <OverlapWidget>
        <WidgetCell
          clickAction="OPEN_APP"
          size={cellSize}
          style={{ borderRadius: WidgetDesign.radius }}
        >
          <WidgetArtwork size={size} artwork={props.track?.artist ?? null} />
        </WidgetCell>

        <WidgetCell
          size={cellSize}
          style={{ marginLeft: cellSize + WidgetDesign.layoutGap }}
        >
          <WidgetArtwork size={size} artwork={null} />
        </WidgetCell>

        <WidgetCell
          size={cellSize}
          style={{ marginTop: cellSize + WidgetDesign.layoutGap }}
        >
          <WidgetArtwork size={size} artwork={null} />
        </WidgetCell>

        <WidgetCell
          size={cellSize}
          style={{
            marginLeft: cellSize + WidgetDesign.layoutGap,
            marginTop: cellSize + WidgetDesign.layoutGap,
          }}
        >
          <WidgetArtwork size={size} artwork={null} />
        </WidgetCell>
      </OverlapWidget>
    </WidgetBaseLayout>
  );
}
