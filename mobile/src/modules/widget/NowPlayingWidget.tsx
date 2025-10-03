import { OverlapWidget } from "react-native-android-widget";

import { Colors } from "~/constants/Styles";
import type { PlayerWidgetData, WithDimensions } from "./types";
import { Action, withAction } from "./constants/Action";
import { Styles } from "./constants/Styles";
import { WidgetArtwork } from "./components/WidgetArtwork";
import { WidgetBaseLayout } from "./components/WidgetBaseLayout";
import { WidgetCell } from "./components/WidgetCell";
import { WidgetSVG } from "./components/WidgetSVG";

type WidgetProps = WithDimensions<PlayerWidgetData & { openApp?: boolean }>;

export function NowPlayingWidget(props: WidgetProps) {
  const size = Math.min(props.width, props.height);

  const cellSize = (size - Styles.layoutGap) / 2;
  const svgSize = cellSize / 2;

  const positionOffset = cellSize + Styles.layoutGap;
  const openApp = props.openApp || props.track === undefined;

  return (
    <WidgetBaseLayout height={size} width={size} transparent>
      <OverlapWidget>
        <WidgetCell
          clickAction={Action.Open}
          size={cellSize}
          style={{ borderRadius: Styles.radius }}
        >
          <WidgetArtwork
            size={cellSize}
            artwork={props.track?.artwork ?? null}
          />
        </WidgetCell>

        <WidgetCell
          clickAction={withAction(Action.PlayPause, openApp)}
          size={cellSize}
          style={{
            marginLeft: positionOffset,
            ...(!props.isPlaying ? { backgroundColor: Colors.red } : {}),
          }}
        >
          <WidgetSVG name={props.isPlaying ? "pause" : "play"} size={svgSize} />
        </WidgetCell>

        <WidgetCell
          clickAction={withAction(Action.Prev, openApp)}
          size={cellSize}
          style={{ marginTop: positionOffset }}
        >
          <WidgetSVG name="prev" size={svgSize} />
        </WidgetCell>

        <WidgetCell
          clickAction={withAction(Action.Next, openApp)}
          size={cellSize}
          style={{ marginLeft: positionOffset, marginTop: positionOffset }}
        >
          <WidgetSVG name="next" size={svgSize} />
        </WidgetCell>
      </OverlapWidget>
    </WidgetBaseLayout>
  );
}
