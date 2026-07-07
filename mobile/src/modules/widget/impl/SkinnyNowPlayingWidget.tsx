// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { FlexWidget } from "react-native-android-widget";

import { Action, withAction } from "../constants/Action";
import { Styles } from "../constants/Styles";
import { WidgetArtwork } from "../components/WidgetArtwork";
import { WidgetBaseLayout } from "../components/WidgetBaseLayout";
import { WidgetCell } from "../components/WidgetCell";
import { WidgetText } from "../components/WidgetText";
import { WidgetSVG } from "../components/WidgetSVG";
import type { PlayerWidgetData, WidgetDefinition } from "../types";

type WidgetProps = WidgetDefinition<PlayerWidgetData>;

const SMALL_GAP = 8;

export function SkinnyNowPlayingWidget(props: WidgetProps) {
  const rowHeight = props.height / 2;

  // Calculate scaled font size for text.
  const maxTextHeight = rowHeight * 0.7;
  const textFontSize = maxTextHeight / 3;

  // Calculate size of actions.
  const contentWidth = props.width - 2 * Styles.layoutGap;
  const svgSize = Math.min(contentWidth / 5, (rowHeight * 2) / 3);

  const clrs = props.stylingConfig;

  return (
    <WidgetBaseLayout
      height="match_parent"
      width="match_parent"
      stylingConfig={clrs}
      style={{ borderRadius: 0 }}
    >
      <FlexWidget
        clickAction={Action.Open}
        style={{ height: rowHeight, flexDirection: "row" }}
      >
        <WidgetCell
          size={rowHeight}
          bgColor={clrs.inactiveColor}
          style={{ borderRadius: clrs.transparent ? SMALL_GAP : 0 }}
        >
          <WidgetArtwork
            size={props.height}
            artwork={props.track?.artwork ?? null}
          />
        </WidgetCell>
        <FlexWidget
          style={{
            height: rowHeight,
            justifyContent: "center",
            paddingHorizontal: SMALL_GAP,
          }}
        >
          <WidgetText
            text={props.track?.title}
            color={clrs.textColor}
            fontSize={textFontSize}
          />
          <WidgetText
            text={props.track?.artist}
            color={clrs.mutedTextColor}
            fontSize={textFontSize}
          />
        </FlexWidget>
      </FlexWidget>

      <FlexWidget
        style={{
          height: rowHeight,
          width: "match_parent",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-evenly",
          flexGap: SMALL_GAP,
          paddingHorizontal: SMALL_GAP,
        }}
      >
        <WidgetSVG
          clickAction={withAction(Action.Prev, props.openApp)}
          name="prev"
          size={svgSize}
          color={clrs.textColor}
        />
        <WidgetSVG
          clickAction={withAction(Action.PlayPause, props.openApp)}
          name={props.isPlaying ? "pause" : "play"}
          size={svgSize}
          color={clrs.textColor}
        />
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
