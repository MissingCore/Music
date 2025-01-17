import type { CircleProps } from "react-native-svg";
import Svg, { Circle, ClipPath, Defs, G, Image, Rect } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";

import { Colors } from "@/constants/Styles";

const CENTER = { cx: 384, cy: 384 };
const GROOVES = {
  ...CENTER,
  fill: "none",
  stroke: "#FFF",
  strokeWidth: 3,
  opacity: 0.075,
} satisfies CircleProps;

/** Plain vinyl component. */
export function Vinyl(props: {
  size: number;
  source: string | null | Array<string | null>;
}) {
  const { canvas } = useTheme();
  return (
    <Svg width={props.size} height={props.size} viewBox="0 0 768 768">
      <Defs>
        <ClipPath id="round">
          <Circle {...CENTER} r={192} />
        </ClipPath>
      </Defs>
      {/* Background */}
      <Circle {...CENTER} r={384} fill={Colors.neutral10} />
      {/* Grooves */}
      <Circle {...GROOVES} r={264} />
      <Circle {...GROOVES} r={304} />
      <Circle {...GROOVES} r={344} />
      {/* Artwork */}
      <Circle {...CENTER} r={192} fill={Colors.red} />
      <RenderArtwork source={props.source} />
      {/* Spin Indicator */}
      <Rect x={384} y={193} width={2} height={24} fill="#FFF" />
      {/* Center hole */}
      <Circle
        {...CENTER}
        r={12}
        fill={canvas}
        stroke={Colors.neutral80}
        strokeWidth={6}
      />
    </Svg>
  );
}

/** Helper to render the artwork in the center of the vinyl. */
function RenderArtwork(props: {
  source: string | null | Array<string | null>;
}) {
  if (props.source === null) return null;
  if (typeof props.source === "string")
    return <SVGImg href={props.source} size={384} rounded />;
  return (
    <G clipPath="url(#round)">
      {props.source.slice(0, 4).map((source, idx) => {
        if (source === null) return null;
        const extraX = idx % 2 === 1;
        const extraY = idx % 4 > 1;
        return (
          <SVGImg key={idx} href={source} size={192} {...{ extraX, extraY }} />
        );
      })}
    </G>
  );
}

/** Special wrapper around SVG's `Image` component. */
function SVGImg(
  props: { size: number; href: string } & Partial<
    Record<"extraX" | "extraY" | "rounded", boolean>
  >,
) {
  return (
    <Image
      href={props.href}
      x={props.extraX ? "50%" : "25%"}
      y={props.extraY ? "50%" : "25%"}
      {...{ width: props.size, height: props.size }}
      preserveAspectRatio="xMidYMid slice" // "background-size: cover"
      {...(props.rounded ? { clipPath: "url(#round)" } : {})}
    />
  );
}
