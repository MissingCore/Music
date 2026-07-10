// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { FlexWidget } from "react-native-android-widget";

import { Action, withAction } from "../constants/Action";
import { Styles } from "../constants/Styles";
import { WidgetArtwork } from "../components/WidgetArtwork";
import { WidgetBaseLayout } from "../components/WidgetBaseLayout";
import { WidgetCell } from "../components/WidgetCell";
import { WidgetSVG } from "../components/WidgetSVG";
import type { PlayerWidgetData, WidgetDefinition } from "../types";
import { applyColor, applyTextColor } from "../utils/customize";

type WidgetProps = WidgetDefinition<PlayerWidgetData>;

export function NowPlayingWidget({ config, ...props }: WidgetProps) {
  const size = Math.min(props.width, props.height);

  const cellSize = (size - Styles.layoutGap) / 2;
  const svgSize = cellSize / 2;

  const openApp = props.openApp || props.track === undefined;

  return (
    <WidgetBaseLayout
      height={size}
      width={size}
      config={config}
      transparent
      style={{ flexGap: Styles.layoutGap }}
    >
      <FlexWidget style={{ flexDirection: "row", flexGap: Styles.layoutGap }}>
        <WidgetCell
          clickAction={Action.Open}
          size={cellSize}
          bgColor={config.bgColor}
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
          bgColor={applyColor(
            config,
            props.isPlaying ? "inactiveColor" : "activeColor",
          )}
        >
          <WidgetSVG
            name={props.isPlaying ? "pause" : "play"}
            size={svgSize}
            color={applyTextColor(
              config,
              props.isPlaying ? "onInactiveColor" : "onActiveColor",
            )}
          />
        </WidgetCell>
      </FlexWidget>
      <FlexWidget style={{ flexDirection: "row", flexGap: Styles.layoutGap }}>
        <WidgetCell
          clickAction={withAction(Action.Prev, openApp)}
          size={cellSize}
          bgColor={applyColor(config, "bgColor")}
        >
          <WidgetSVG name="prev" size={svgSize} color={config.textColor} />
        </WidgetCell>

        <WidgetCell
          clickAction={withAction(Action.Next, openApp)}
          size={cellSize}
          bgColor={applyColor(config, "bgColor")}
        >
          <WidgetSVG name="next" size={svgSize} color={config.textColor} />
        </WidgetCell>
      </FlexWidget>
    </WidgetBaseLayout>
  );
}
