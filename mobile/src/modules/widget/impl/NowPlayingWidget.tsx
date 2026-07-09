// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { OverlapWidget } from "react-native-android-widget";

import { Action, withAction } from "../constants/Action";
import { Styles } from "../constants/Styles";
import { WidgetArtwork } from "../components/WidgetArtwork";
import { WidgetBaseLayout } from "../components/WidgetBaseLayout";
import { WidgetCell } from "../components/WidgetCell";
import { WidgetSVG } from "../components/WidgetSVG";
import type { PlayerWidgetData, WidgetDefinition } from "../types";

type WidgetProps = WidgetDefinition<PlayerWidgetData>;

export function NowPlayingWidget(props: WidgetProps) {
  const size = Math.min(props.width, props.height);

  const cellSize = (size - Styles.layoutGap) / 2;
  const svgSize = cellSize / 2;

  const positionOffset = cellSize + Styles.layoutGap;
  const openApp = props.openApp || props.track === undefined;

  const clrs = props.config;

  return (
    <WidgetBaseLayout height={size} width={size} config={clrs} transparent>
      <OverlapWidget>
        <WidgetCell
          clickAction={Action.Open}
          size={cellSize}
          bgColor={clrs.bgColor}
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
          bgColor={clrs[props.isPlaying ? "inactiveColor" : "activeColor"]}
          style={{ marginLeft: positionOffset }}
        >
          <WidgetSVG
            name={props.isPlaying ? "pause" : "play"}
            size={svgSize}
            color={clrs[props.isPlaying ? "onInactiveColor" : "onActiveColor"]}
          />
        </WidgetCell>

        <WidgetCell
          clickAction={withAction(Action.Prev, openApp)}
          size={cellSize}
          bgColor={clrs.bgColor}
          style={{ marginTop: positionOffset }}
        >
          <WidgetSVG name="prev" size={svgSize} color={clrs.textColor} />
        </WidgetCell>

        <WidgetCell
          clickAction={withAction(Action.Next, openApp)}
          size={cellSize}
          bgColor={clrs.bgColor}
          style={{ marginLeft: positionOffset, marginTop: positionOffset }}
        >
          <WidgetSVG name="next" size={svgSize} color={clrs.textColor} />
        </WidgetCell>
      </OverlapWidget>
    </WidgetBaseLayout>
  );
}
