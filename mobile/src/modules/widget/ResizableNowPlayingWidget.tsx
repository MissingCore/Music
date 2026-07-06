// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { TextWidgetProps } from "react-native-android-widget";
import {
  FlexWidget,
  OverlapWidget,
  TextWidget,
} from "react-native-android-widget";

import type { PlayerWidgetData, WidgetConfig, WidgetDefinition } from "./types";
import { Action, withAction } from "./constants/Action";
import { Styles } from "./constants/Styles";
import { WidgetArtwork } from "./components/WidgetArtwork";
import { WidgetBaseLayout } from "./components/WidgetBaseLayout";
import { WidgetCell } from "./components/WidgetCell";
import { WidgetSVG } from "./components/WidgetSVG";

type WidgetProps = WidgetDefinition<PlayerWidgetData>;

export function ResizableNowPlayingWidget(props: WidgetProps) {
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

  const clrs = props.stylingConfig;

  return (
    <WidgetBaseLayout
      clickAction={Action.Open}
      height={widgetHeight}
      width={props.width}
      stylingConfig={clrs}
    >
      <OverlapWidget>
        <WidgetCell
          size={widgetHeight}
          bgColor={clrs.inactiveColor}
          style={{ borderRadius: 0 }}
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
            text={props.track?.title ?? "—"}
            maxLines={2}
            style={{ fontSize: textFontSize, color: clrs.textColor }}
          />
          <WidgetText
            text={props.track?.artist ?? "—"}
            maxLines={1}
            style={{
              fontSize: textFontSize,
              color: clrs.mutedTextColor,
              paddingBottom: contentPadding,
            }}
          />
          <MediaControls
            maxWidth={contentWidth}
            maxHeight={widgetHeight / 4}
            openApp={openApp}
            isPlaying={props.isPlaying}
            stylingConfig={clrs}
          />
        </FlexWidget>
      </OverlapWidget>
    </WidgetBaseLayout>
  );
}

//#region Layout Helpers
function WidgetText({ style, ...props }: TextWidgetProps) {
  return (
    <TextWidget
      truncate="END"
      allowFontScaling={false}
      style={{ fontFamily: "Inter-Regular", ...style }}
      {...props}
    />
  );
}

function MediaControls(props: {
  maxWidth: number;
  maxHeight: number;
  openApp: boolean;
  isPlaying: boolean;
  stylingConfig: WidgetConfig;
}) {
  const svgSize = Math.min(props.maxWidth / 7, (props.maxHeight * 2) / 3);
  const paddingY = svgSize / 9;
  const paddingX = paddingY * 5;

  const clrs = props.stylingConfig;

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
        color={clrs.textColor}
      />
      <FlexWidget
        clickAction={withAction(Action.PlayPause, props.openApp)}
        style={{
          paddingHorizontal: paddingX,
          paddingVertical: paddingY,
          backgroundColor:
            clrs[!props.isPlaying ? "activeColor" : "inactiveColor"],
          borderRadius: 999,
        }}
      >
        <WidgetSVG
          name={props.isPlaying ? "pause" : "play"}
          size={svgSize}
          color={clrs[!props.isPlaying ? "onActiveColor" : "onInactiveColor"]}
        />
      </FlexWidget>
      <WidgetSVG
        clickAction={withAction(Action.Next, props.openApp)}
        name="next"
        size={svgSize}
        color={clrs.textColor}
      />
    </FlexWidget>
  );
}
//#endregion
