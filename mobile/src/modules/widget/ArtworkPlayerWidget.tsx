import {
  FlexWidget,
  OverlapWidget,
  SvgWidget,
} from "react-native-android-widget";

import { Colors } from "~/constants/Styles";
import type { PlayerWidgetData, WithDimensions } from "./types";
import { WidgetArtwork } from "./components/WidgetArtwork";
import { WidgetBaseLayout } from "./components/WidgetBaseLayout";

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
            svgString={props.isPlaying ? playArrowSVG : pauseSVG}
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
  svgString,
  opacityState,
}: {
  size: number;
  svgString: string;
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
      <SvgWidget svg={svgString} style={{ height: svgSize, width: svgSize }} />
    </FlexWidget>
  );
}
//#endregion

//#region SVGs
const playArrowSVG = `
  <svg width="100%" height="100%" viewBox="0 -960 960 960" fill="${Colors.neutral100}">
    <path d="M345.66-307.55v-345.09q0-15.13 10.31-24.57t24-9.44q4.34 0 9 1.06 4.67 1.05 9.02 3.58l271.12 173.39q7.73 5.44 11.7 12.82 3.96 7.38 3.96 15.8 0 8.42-3.96 15.8-3.97 7.38-11.7 12.62L397.99-278.19q-4.37 2.73-9.05 3.78-4.67 1.06-8.77 1.06-13.94 0-24.23-9.44-10.28-9.44-10.28-24.76Z" />
  </svg>
`;

const pauseSVG = `
  <svg width="100%" height="100%" viewBox="0 -960 960 960" fill="${Colors.neutral100}">
    <path d="M615.65-226.46q-23.05 0-39.5-16.55-16.46-16.54-16.46-39.41v-395.16q0-22.87 16.46-39.41 16.45-16.55 39.5-16.55h34.04q22.88 0 39.42 16.55 16.54 16.54 16.54 39.41v395.16q0 22.87-16.54 39.41-16.54 16.55-39.42 16.55h-34.04Zm-305.15 0q-23.05 0-39.51-16.55-16.45-16.54-16.45-39.41v-395.16q0-22.87 16.45-39.41 16.46-16.55 39.51-16.55h34.04q22.87 0 39.42 16.55 16.54 16.54 16.54 39.41v395.16q0 22.87-16.54 39.41-16.55 16.55-39.42 16.55H310.5Z" />
  </svg>
`;
//#endregion
