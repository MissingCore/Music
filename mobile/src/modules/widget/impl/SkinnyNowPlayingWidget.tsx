// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { FlexWidget } from "react-native-android-widget";

import { Action } from "../constants/Action";
import { WidgetArtwork } from "../components/WidgetArtwork";
import { WidgetBaseLayout } from "../components/WidgetBaseLayout";
import { WidgetCell } from "../components/WidgetCell";
import { WidgetSVG } from "../components/WidgetSVG";
import type { PlayerWidgetData, WidgetDefinition } from "../types";
import type { MediaActionKey } from "../utils/customize";
import { getMediaActionConfigFactory } from "../utils/customize";

type WidgetProps = WidgetDefinition<PlayerWidgetData>;

const SMALL_GAP = 8;
const FULL_ROUNDED = 999;

export function SkinnyNowPlayingWidget({ config, ...props }: WidgetProps) {
  const showAdditionalActions = props.width > props.height * 2.5;

  // Calculate height of widget if we only support showing the play/pause action.
  let widgetHeight = props.height;
  if (!showAdditionalActions) {
    const threshold = props.width / 2;
    while (widgetHeight > threshold) {
      widgetHeight -= 1;
    }
  }

  // Calculate size of actions.
  const contentWidth = props.width - widgetHeight - 2 * SMALL_GAP;
  const svgSize = Math.min(
    contentWidth / (showAdditionalActions ? 5 : 2),
    (widgetHeight * 2) / 3,
  );

  // Get reuseable configs for "Now Playing" type widgets.
  const getMediaActionConfg = getMediaActionConfigFactory({ config, ...props });
  const renderMediaControl = (key: MediaActionKey) => {
    const { action, icon } = getMediaActionConfg(key);
    return (
      <WidgetSVG
        clickAction={action}
        name={icon}
        size={svgSize}
        color={config.textColor}
      />
    );
  };

  return (
    <WidgetBaseLayout
      config={config}
      height={widgetHeight}
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderRadius: FULL_ROUNDED,
      }}
    >
      <WidgetCell
        clickAction={Action.Open}
        size={widgetHeight}
        bgColor={config.inactiveColor}
        style={{ borderRadius: FULL_ROUNDED }}
      >
        <WidgetArtwork
          size={widgetHeight}
          artwork={props.track?.artwork ?? null}
        />
      </WidgetCell>

      <FlexWidget
        style={{
          width: props.width - widgetHeight,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-evenly",
          flexGap: SMALL_GAP,
          paddingHorizontal: SMALL_GAP,
        }}
      >
        {showAdditionalActions ? renderMediaControl("prev") : null}
        {renderMediaControl("playToggle")}
        {showAdditionalActions ? renderMediaControl("next") : null}
      </FlexWidget>
    </WidgetBaseLayout>
  );
}
