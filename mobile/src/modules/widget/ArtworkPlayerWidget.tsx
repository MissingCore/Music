import { FlexWidget, OverlapWidget } from "react-native-android-widget";

import { Colors } from "~/constants/Styles";
import type { PlayerWidgetData, WithDimensions } from "./types";
import { WidgetArtwork } from "./components/WidgetArtwork";
import { WidgetBaseLayout } from "./components/WidgetBaseLayout";
import { WidgetSVG } from "./components/WidgetSVG";

type WidgetProps = WithDimensions<
  PlayerWidgetData & { overlayState?: number; openApp?: boolean }
>;

export function ArtworkPlayerWidget(props: WidgetProps) {
  const size = Math.min(props.width, props.height);
  const overlayShown = props.overlayState !== undefined;

  if (!props.track) return <NotFoundWidget size={size} />;
  return (
    <WidgetBaseLayout height={size} width={size}>
      <OverlapWidget>
        <WidgetArtwork
          clickAction={
            props.openApp
              ? "OPEN_APP"
              : !overlayShown
                ? "PLAY_PAUSE"
                : undefined
          }
          size={size}
          artwork={props.track.artwork}
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

/** Default placeholder widget when we have no data. */
function NotFoundWidget({ size }: { size: number }) {
  return (
    <WidgetBaseLayout
      clickAction="OPEN_APP"
      height={size}
      width={size}
      style={{ alignItems: "center", justifyContent: "center" }}
    >
      <WidgetArtwork size={size} artwork={null} />
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
