import { OverlapWidget } from "react-native-android-widget";

import type { PlayerWidgetData, WithDimensions } from "./types";
import { WidgetDesign } from "./constants";
import { WidgetArtwork } from "./components/WidgetArtwork";
import { WidgetBaseLayout } from "./components/WidgetBaseLayout";
import { WidgetCell } from "./components/WidgetCell";
import { WidgetSVG } from "./components/WidgetSVG";

type WidgetProps = WithDimensions<PlayerWidgetData & { openApp?: boolean }>;

export function NowPlayingWidget(props: WidgetProps) {
  const size = Math.min(props.width, props.height);

  const cellSize = (size - WidgetDesign.layoutGap) / 2;
  const svgSize = cellSize / 2;

  const positionOffset = cellSize + WidgetDesign.layoutGap;

  return (
    <WidgetBaseLayout height={size} width={size} transparent>
      <OverlapWidget>
        <WidgetCell
          clickAction="OPEN_APP"
          size={cellSize}
          style={{ borderRadius: WidgetDesign.radius }}
        >
          <WidgetArtwork
            size={cellSize}
            artwork={props.track?.artist ?? null}
          />
        </WidgetCell>

        <WidgetCell size={cellSize} style={{ marginLeft: positionOffset }}>
          <WidgetSVG name={props.isPlaying ? "play" : "pause"} size={svgSize} />
        </WidgetCell>

        <WidgetCell size={cellSize} style={{ marginTop: positionOffset }}>
          <WidgetSVG name="prev" size={svgSize} />
        </WidgetCell>

        <WidgetCell
          size={cellSize}
          style={{ marginLeft: positionOffset, marginTop: positionOffset }}
        >
          <WidgetSVG name="next" size={svgSize} />
        </WidgetCell>
      </OverlapWidget>
    </WidgetBaseLayout>
  );
}
