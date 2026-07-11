// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { FlexWidget } from "react-native-android-widget";

import { Action } from "../constants/Action";
import { Styles } from "../constants/Styles";
import { WidgetArtwork } from "../components/WidgetArtwork";
import { WidgetBaseLayout } from "../components/WidgetBaseLayout";
import { WidgetCell } from "../components/WidgetCell";
import { WidgetSVG } from "../components/WidgetSVG";
import type { PlayerWidgetData, WidgetDefinition } from "../types";
import type { MediaActionKey } from "../utils/customize";
import { getMediaActionConfigFactory } from "../utils/customize";

type WidgetProps = WidgetDefinition<PlayerWidgetData>;

export function NowPlayingWidget({ config, ...props }: WidgetProps) {
  const size = Math.min(props.width, props.height);

  const cellSize = (size - Styles.layoutGap) / 2;
  const svgSize = cellSize / 2;

  // Get reuseable configs for "Now Playing" type widgets.
  const getMediaActionConfg = getMediaActionConfigFactory({ config, ...props });
  const renderMediaControl = (key: MediaActionKey) => {
    const { action, color, icon } = getMediaActionConfg(key);
    return (
      <WidgetCell clickAction={action} size={cellSize} bgColor={color.bg}>
        <WidgetSVG name={icon} size={svgSize} color={color.onBg} />
      </WidgetCell>
    );
  };

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
            artwork={props.track?.artwork}
            placeholderColor={config.textColor}
          />
        </WidgetCell>
        {renderMediaControl("playToggle")}
      </FlexWidget>
      <FlexWidget style={{ flexDirection: "row", flexGap: Styles.layoutGap }}>
        {renderMediaControl("prev")}
        {renderMediaControl("next")}
      </FlexWidget>
    </WidgetBaseLayout>
  );
}
