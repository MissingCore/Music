// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { FlexWidget, OverlapWidget } from "react-native-android-widget";

import { Action, withAction } from "../constants/Action";
import { Styles } from "../constants/Styles";
import { WidgetArtwork } from "../components/WidgetArtwork";
import { WidgetBaseLayout } from "../components/WidgetBaseLayout";
import { WidgetCell } from "../components/WidgetCell";
import { WidgetText } from "../components/WidgetText";
import { WidgetSVG } from "../components/WidgetSVG";
import type {
  PlayerWidgetData,
  WidgetConfig,
  WidgetDefinition,
} from "../types";

type WidgetProps = WidgetDefinition<PlayerWidgetData>;

export function ResizableNowPlayingWidget({ config, ...props }: WidgetProps) {
  const canUseFullArea = props.width - props.height > 2 * props.height;
  let widgetHeight = props.height;

  // We want the width to be ~(2x the widget height + Styles.layoutGap).
  if (!canUseFullArea) {
    const threshold = (props.width - Styles.layoutGap) / 2;
    while (widgetHeight > threshold) {
      widgetHeight -= 1;
    }
  }

  const contentPadding = Math.max(
    Styles.layoutGap / 2,
    Math.min(widgetHeight / 14, Styles.layoutGap),
  );
  const contentWidth = props.width - widgetHeight - 2 * contentPadding;

  // Calculate scaled font size for text.
  const maxTextHeight = widgetHeight * 0.55 - 3 * contentPadding;
  const textFontSize = maxTextHeight / 4;

  const openApp = props.openApp || props.track === undefined;

  return (
    <WidgetBaseLayout
      clickAction={Action.Open}
      height={widgetHeight}
      config={config}
    >
      <OverlapWidget>
        <WidgetCell
          size={widgetHeight}
          bgColor={config.inactiveColor}
          style={{ borderRadius: config.transparent ? Styles.radius : 0 }}
        >
          <WidgetArtwork
            size={widgetHeight}
            artwork={props.track?.artwork ?? null}
          />
        </WidgetCell>
        <FlexWidget
          style={{
            height: widgetHeight,
            justifyContent: "flex-end",
            padding: contentPadding,
            marginLeft: widgetHeight,
          }}
        >
          <WidgetText
            text={props.track?.title}
            maxLines={2}
            color={config.textColor}
            fontSize={textFontSize}
          />
          <WidgetText
            text={props.track?.artist}
            color={config.mutedTextColor}
            fontSize={textFontSize}
            style={{ paddingBottom: contentPadding }}
          />
          <MediaControls
            maxWidth={contentWidth}
            maxHeight={widgetHeight / 4}
            openApp={openApp}
            isPlaying={props.isPlaying}
            config={config}
          />
        </FlexWidget>
      </OverlapWidget>
    </WidgetBaseLayout>
  );
}

//#region Layout Helpers
function MediaControls({
  config,
  ...props
}: {
  maxWidth: number;
  maxHeight: number;
  openApp: boolean;
  isPlaying: boolean;
  config: WidgetConfig;
}) {
  const svgSize = Math.min(props.maxWidth / 7, (props.maxHeight * 2) / 3);
  const paddingY = svgSize / 9;
  const paddingX = paddingY * 5;

  return (
    <FlexWidget
      style={{
        width: props.maxWidth,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-evenly",
      }}
    >
      <WidgetSVG
        clickAction={withAction(Action.Prev, props.openApp)}
        name="prev"
        size={svgSize}
        color={config.textColor}
      />
      <FlexWidget
        clickAction={withAction(Action.PlayPause, props.openApp)}
        style={{
          paddingHorizontal: paddingX,
          paddingVertical: paddingY,
          backgroundColor:
            config[props.isPlaying ? "inactiveColor" : "activeColor"],
          borderRadius: 999,
        }}
      >
        <WidgetSVG
          name={props.isPlaying ? "pause" : "play"}
          size={svgSize}
          color={config[props.isPlaying ? "onInactiveColor" : "onActiveColor"]}
        />
      </FlexWidget>
      <WidgetSVG
        clickAction={withAction(Action.Next, props.openApp)}
        name="next"
        size={svgSize}
        color={config.textColor}
      />
    </FlexWidget>
  );
}
//#endregion
