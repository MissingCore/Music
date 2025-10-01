import type {
  ClickActionProps,
  FlexWidgetStyle,
} from "react-native-android-widget";
import {
  FlexWidget,
  ImageWidget,
  OverlapWidget,
  SvgWidget,
} from "react-native-android-widget";

import { BorderRadius, Colors } from "~/constants/Styles";
import type { WidgetBaseProps } from "./types";

type WidgetProps = WidgetBaseProps & {
  height: number;
  width: number;
  overlayState?: number;
};

export function MusicPlayerWidget(props: WidgetProps) {
  const size = Math.min(props.width, props.height);
  const overlayShown = props.overlayState !== undefined;

  if (!props.track) return <NotFoundWidget size={size} />;
  return (
    <WidgetAlignment>
      <SquareWidgetBase size={size}>
        <OverlapWidget>
          <Artwork
            clickAction={!overlayShown ? "PLAY_PAUSE" : undefined}
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
      </SquareWidgetBase>
    </WidgetAlignment>
  );
}

/** Default placeholder widget when we have no data. */
function NotFoundWidget({ size }: { size: number }) {
  return (
    <WidgetAlignment>
      <SquareWidgetBase
        clickAction="OPEN_APP"
        size={size}
        style={{ alignItems: "center", justifyContent: "center" }}
      >
        <Artwork size={size} artwork={null} />
      </SquareWidgetBase>
    </WidgetAlignment>
  );
}

//#region Layout Helpers
function WidgetAlignment(props: { children: React.ReactNode }) {
  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        alignItems: "center",
        justifyContent: "center",
      }}
      {...props}
    />
  );
}

function SquareWidgetBase({
  size,
  style,
  ...props
}: ClickActionProps & {
  size: number;
  children: React.ReactNode;
  style?: FlexWidgetStyle;
}) {
  return (
    <FlexWidget
      style={{
        overflow: "hidden",
        height: size,
        width: size,
        backgroundColor: Colors.neutral10,
        borderRadius: BorderRadius.xl,
        ...style,
      }}
      {...props}
    />
  );
}

function Artwork({
  size,
  artwork,
  ...props
}: ClickActionProps & { size: number; artwork: string | null }) {
  const imageSize = !artwork ? (size * 5) / 6 : size;
  return (
    <ImageWidget
      image={artwork ?? require("~/resources/images/music-glyph.png")}
      imageHeight={imageSize}
      imageWidth={imageSize}
      {...props}
    />
  );
}

// Hex Opacities.
const bgOpacities = ["66", "5E"]; // 40%, 37%

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
