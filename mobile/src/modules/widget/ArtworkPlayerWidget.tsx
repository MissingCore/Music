import { FlexWidget, OverlapWidget } from "react-native-android-widget";

import { Colors } from "~/constants/Styles";
import type { PlayerWidgetData, WithDimensions } from "./types";
import { Action, withAction } from "./constants/Action";
import { WidgetArtwork } from "./components/WidgetArtwork";
import { WidgetBaseLayout } from "./components/WidgetBaseLayout";
import { WidgetSVG } from "./components/WidgetSVG";

type WidgetProps = WithDimensions<
  PlayerWidgetData & { overlayState?: number; openApp?: boolean }
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

function SVGOverlay({
  size,
  svgName,
  opacityState,
}: {
  size: number;
  svgName: "play" | "pause";
  opacityState: number;
}) {
  const svgSize = size / 3;
  return (
    <FlexWidget
      style={{
        height: size,
        width: size,
        alignItems: "center",
        justifyContent: "center",
        // To fake a fade effect.
        backgroundColor: `${Colors.neutral0}${bgOpacities[opacityState]}`,
      }}
    >
      <WidgetSVG name={svgName} size={svgSize} />
    </FlexWidget>
  );
}
//#endregion
