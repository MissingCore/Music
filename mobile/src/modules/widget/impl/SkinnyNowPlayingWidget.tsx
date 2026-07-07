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

type WidgetProps = WidgetDefinition<PlayerWidgetData>;

export function SkinnyNowPlayingWidget(props: WidgetProps) {
  const size = Math.min(props.width, props.height);

  const contentWidth = props.width - size - Styles.layoutGap;

  const svgSize = Math.min(contentWidth / 7, (props.height * 2) / 3);
  const paddingY = svgSize / 9;
  const paddingX = paddingY * 5;

  const clrs = props.stylingConfig;

  return (
    <WidgetBaseLayout
      clickAction={Action.Open}
      height={props.height}
      width={props.width}
      stylingConfig={clrs}
    >
      <WidgetCell
        size={props.height}
        bgColor={clrs.inactiveColor}
        style={{ borderRadius: clrs.transparent ? Styles.radius : 0 }}
      >
        <WidgetArtwork
          size={props.height}
          artwork={props.track?.artwork ?? null}
        />
      </WidgetCell>

      <FlexWidget
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-evenly",
          flexGap: Styles.layoutGap,
        }}
      >
        <WidgetSVG
          clickAction={withAction(Action.Prev, props.openApp)}
          name="prev"
          size={svgSize}
          color={clrs.textColor}
        />
        <FlexWidget
          clickAction={withAction(Action.PlayPause, props.openApp)}
          style={{
            paddingHorizontal: paddingX,
            paddingVertical: paddingY,
            backgroundColor:
              clrs[props.isPlaying ? "inactiveColor" : "activeColor"],
            borderRadius: 999,
          }}
        >
          <WidgetSVG
            name={props.isPlaying ? "pause" : "play"}
            size={svgSize}
            color={clrs[props.isPlaying ? "onInactiveColor" : "onActiveColor"]}
          />
        </FlexWidget>
        <WidgetSVG
          clickAction={withAction(Action.Next, props.openApp)}
          name="next"
          size={svgSize}
          color={clrs.textColor}
        />
      </FlexWidget>
    </WidgetBaseLayout>
  );
}
