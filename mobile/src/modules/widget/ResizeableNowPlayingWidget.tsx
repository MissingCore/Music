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

export function ResizeableNowPlayingWidget(props: WidgetProps) {
  const canUseFullArea = props.width - props.height > 2 * props.height;
  let widgetHeight = props.height;

  // We want the width to be ~(2x the widget height + Styles.layoutGap).
  if (!canUseFullArea) {
    const threshold = (props.width - Styles.layoutGap) / 2;
    while (widgetHeight > threshold) {
      widgetHeight -= 1;
    }
  }

  return (
    <WidgetBaseLayout height={widgetHeight} width={props.width}>
      {/* <OverlapWidget>
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
      </OverlapWidget> */}
    </WidgetBaseLayout>
  );
}
