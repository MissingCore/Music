import { OverlapWidget } from "react-native-android-widget";

import { Colors } from "~/constants/Styles";
import type { PlayerWidgetData, WithDimensions } from "./types";
import { WidgetAction, WidgetDesign } from "./constants";
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
          clickAction={WidgetAction.Open}
          size={cellSize}
          style={{ borderRadius: WidgetDesign.radius }}
        >
          <WidgetArtwork
            size={cellSize}
            artwork={props.track?.artwork ?? null}
          />
        </WidgetCell>

        <WidgetCell
          clickAction={withAction(WidgetAction.PlayPause, props.openApp)}
          size={cellSize}
          style={{
            marginLeft: positionOffset,
            ...(!props.isPlaying ? { backgroundColor: Colors.red } : {}),
          }}
        >
          <WidgetSVG name={props.isPlaying ? "pause" : "play"} size={svgSize} />
        </WidgetCell>

        <WidgetCell
          clickAction={withAction(WidgetAction.Prev, props.openApp)}
          size={cellSize}
          style={{ marginTop: positionOffset }}
        >
          <WidgetSVG name="prev" size={svgSize} />
        </WidgetCell>

        <WidgetCell
          clickAction={withAction(WidgetAction.Next, props.openApp)}
          size={cellSize}
          style={{ marginLeft: positionOffset, marginTop: positionOffset }}
        >
          <WidgetSVG name="next" size={svgSize} />
        </WidgetCell>
      </OverlapWidget>
    </WidgetBaseLayout>
  );
}

function withAction(action: string, openApp?: boolean) {
  return openApp ? WidgetAction.Open : action;
}
