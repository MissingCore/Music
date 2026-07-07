// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { FlexWidget, OverlapWidget } from "react-native-android-widget";

import { Colors } from "~/constants/Styles";
import { Action, withAction } from "../constants/Action";
import { WidgetArtwork } from "../components/WidgetArtwork";
import { WidgetBaseLayout } from "../components/WidgetBaseLayout";
import { WidgetSVG } from "../components/WidgetSVG";
import type { PlayerWidgetData, WidgetDefinition } from "../types";

type WidgetProps = WidgetDefinition<
  PlayerWidgetData & { overlayState?: number }
>;

export function ArtworkPlayerWidget(props: WidgetProps) {
  const size = Math.min(props.width, props.height);
  const overlayShown = props.overlayState !== undefined;

  const openApp = props.openApp || props.track === undefined;

  return (
    <WidgetBaseLayout
      height={size}
      width={size}
      style={{ alignItems: "center", justifyContent: "center" }}
      stylingConfig={props.stylingConfig}
    >
      <OverlapWidget>
        <WidgetArtwork
          clickAction={withAction(
            !overlayShown ? Action.PlayPause : undefined,
            openApp,
          )}
          size={size}
          artwork={props.track?.artwork ?? null}
        />
        {overlayShown ? (
          <SVGOverlay
            size={size}
            svgName={props.isPlaying ? "play" : "pause"}
            opacityState={props.overlayState!}
          />
        ) : null}
      </OverlapWidget>
    </WidgetBaseLayout>
  );
}

//#region Layout Helpers
// Hex Opacities.
const bgOpacities = ["4D", "40"]; // 30%, 25%

function SVGOverlay(props: {
  size: number;
  svgName: "play" | "pause";
  opacityState: number;
}) {
  const svgSize = props.size / 3;
  return (
    <FlexWidget
      style={{
        height: props.size,
        width: props.size,
        alignItems: "center",
        justifyContent: "center",
        // To fake a fade effect.
        backgroundColor: `${Colors.neutral0}${bgOpacities[props.opacityState]}`,
      }}
    >
      <WidgetSVG name={props.svgName} size={svgSize} color="#FFFFFF" />
    </FlexWidget>
  );
}
//#endregion
