// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { FlexWidget } from "react-native-android-widget";

import { Action } from "../constants/Action";
import { Styles } from "../constants/Styles";
import { WidgetArtwork } from "../components/WidgetArtwork";
import { WidgetBaseLayout } from "../components/WidgetBaseLayout";
import { WidgetCell } from "../components/WidgetCell";
import { WidgetText } from "../components/WidgetText";
import { WidgetSVG } from "../components/WidgetSVG";
import type { PlayerWidgetData, WidgetDefinition } from "../types";
import type { MediaActionKey } from "../utils/customize";
import { getMediaActionConfigFactory } from "../utils/customize";

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

  // Calculate size of actions.
  const svgSize = Math.min(contentWidth / 7, widgetHeight / 6);
  const paddingY = svgSize / 9;
  const paddingX = paddingY * 5;

  // Get reuseable configs for "Now Playing" type widgets.
  const getMediaActionConfg = getMediaActionConfigFactory({ config, ...props });
  const renderMediaControl = (key: MediaActionKey) => {
    const { action, color, icon } = getMediaActionConfg(key);
    return (
      <FlexWidget
        clickAction={action}
        style={{
          paddingHorizontal: paddingX,
          paddingVertical: paddingY,
          backgroundColor: color.bg,
          borderRadius: 999,
        }}
      >
        <WidgetSVG name={icon} size={svgSize} color={color.onBg} />
      </FlexWidget>
    );
  };

  return (
    <WidgetBaseLayout
      clickAction={Action.Open}
      height={widgetHeight}
      config={config}
      style={{ flexDirection: "row" }}
    >
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
        <FlexWidget
          style={{
            width: contentWidth,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-evenly",
          }}
        >
          {renderMediaControl("prev")}
          {renderMediaControl("playToggle")}
          {renderMediaControl("next")}
        </FlexWidget>
      </FlexWidget>
    </WidgetBaseLayout>
  );
}
