import { useMemo } from "react";
import { View, useWindowDimensions } from "react-native";
import {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
  Svg,
} from "react-native-svg";

import { useEqualizerStore } from "../core/store";

import { OnRTL } from "~/lib/react";
import { Em } from "~/components/Typography/StyledText";
import { useTheme } from "~/modules/theme/hooks";

const YPadding = 16;
const Ordinate = 72; // Distance from x-axis.
const ClampedOrdinate = Ordinate - YPadding;
const GraphHeight = Ordinate * 2 + 1;
const XAxisYPos = Ordinate + 1;

/** Graph displaying Equalizer configuration based on the Nothing X design. */
export function EQGraph(props: EQLineProps) {
  return (
    <View
      style={{ height: GraphHeight }}
      className="relative mb-4 w-full rounded-xl bg-surfaceContainerLowest"
    >
      <Svg style={{ height: "100%", width: "100%" }}>
        <GraphAnnotations />
        <EQLine points={props.points} />
      </Svg>
      <GraphLabels />
    </View>
  );
}

//#region EQ Line
interface EQLineProps {
  /** Array of frequency (x) to their band level (y). */
  points: Array<{ x: number; y: number }>;
}

function EQLine(props: EQLineProps) {
  const { scheme, onSurfaceVariant, surfaceContainerHigh } = useTheme();
  const width = useGraphWidth();
  const eqBandOrdinate = useEqualizerStore((s) => s.bandOrdinate);

  const points = useMemo(
    () =>
      props.points.map(({ x, y }) => ({
        x: guessXPercentage(x) * width,
        y: guessYCoordinate(y, eqBandOrdinate),
      })),
    [width, eqBandOrdinate, props.points],
  );

  const path = useMemo(() => {
    const linePoints = [`M ${0} ${XAxisYPos}`];
    points.forEach((point) => linePoints.push(`L ${point.x} ${point.y}`));
    linePoints.push(`L ${width} ${XAxisYPos}`);
    return linePoints.join(" ");
  }, [width, points]);

  const minY = useMemo(
    () => Math.min(...points.map(({ y }) => y), XAxisYPos),
    [points],
  );
  const maxY = useMemo(() => Math.max(...points.map(({ y }) => y)), [points]);

  return (
    <>
      <Defs>
        <LinearGradient id="eq-grad" x1={0} y1={0} x2={0} y2={1}>
          <Stop offset={0} stopColor={surfaceContainerHigh} stopOpacity={1} />
          <Stop
            offset={(XAxisYPos - minY) / (Math.max(maxY, XAxisYPos) - minY)}
            stopColor={surfaceContainerHigh}
            stopOpacity={scheme === "dark" ? 0.25 : 0.15}
          />
          <Stop offset={1} stopColor={surfaceContainerHigh} stopOpacity={1} />
        </LinearGradient>
      </Defs>

      <Path d={path} stroke={surfaceContainerHigh} fill="url(#eq-grad)" />
      {points.map(({ x, y }, index) => (
        <Circle key={index} cx={x} cy={y} r={2} fill={onSurfaceVariant} />
      ))}
    </>
  );
}

/**
 * Guess how far from the left the point should be positioned, relative
 * to the fixed frequencies.
 */
function guessXPercentage(x: number): number {
  const upperBoundIdx = DisplayedFrequencies.findIndex((f) => x < f.value);
  if (upperBoundIdx <= 0) throw new Error("Frequency Band not supported.");

  const lower = DisplayedFrequencies[upperBoundIdx - 1]!; // `upperBoundIdx` can't be `0`.
  const upper = DisplayedFrequencies[upperBoundIdx]!;

  const additionalPercentFactor = upper.xPosPercent - lower.xPosPercent;
  const percentInBound = (x - lower.value) / (upper.value - lower.value);

  return lower.xPosPercent + additionalPercentFactor * percentInBound;
}

function guessYCoordinate(y: number, bound: number): number {
  if (y === 0) return XAxisYPos;
  else if (y > 0) return YPadding + ((bound - y) / bound) * ClampedOrdinate;
  return XAxisYPos + Math.abs(y / bound) * ClampedOrdinate;
}
//#endregion

//#region Graph Annotations
const DisplayedFrequencies = [
  { label: "20", value: 20000, xPosPercent: 0.05 },
  { label: "50", value: 50000, xPosPercent: 0.18 },
  { label: "100", value: 100000, xPosPercent: 0.26 },
  { label: "500", value: 500000, xPosPercent: 0.47 },
  { label: "1k", value: 1000000, xPosPercent: 0.56 },
  { label: "5k", value: 5000000, xPosPercent: 0.76 },
  { label: "10k", value: 10000000, xPosPercent: 0.85 },
  { label: "20k", value: 20000000, xPosPercent: 0.95 },
];

/** Draws x-axis and tick marks for certain frequencies. */
function GraphAnnotations() {
  const width = useGraphWidth();
  const { surfaceContainer } = useTheme();
  return (
    <>
      {/* X-axis */}
      <Path
        d={`M ${0} ${XAxisYPos} L ${width} ${XAxisYPos}`}
        stroke={surfaceContainer}
      />
      {/* Frequency Tick Marks + Labels */}
      {DisplayedFrequencies.map(({ label, xPosPercent }) => {
        const xPos = width * xPosPercent;
        return (
          <Path
            key={label}
            d={`M ${xPos} ${0} L ${xPos} ${GraphHeight}`}
            stroke={surfaceContainer}
          />
        );
      })}
    </>
  );
}

/**
 * Displays the tick labels separately as they would disappear when
 * navigating back when in `<GraphAnnotations />`.
 */
function GraphLabels() {
  const width = useGraphWidth();
  return DisplayedFrequencies.map(({ label, xPosPercent }) => (
    <Em
      key={label}
      style={{
        [OnRTL.decide("right", "left")]: width * xPosPercent,
        fontSize: 8,
      }}
      className="absolute top-full -translate-x-1/2 translate-y-0.5"
    >
      {label}
    </Em>
  ));
}
//#endregion

//#region Utils
/** Returns width of the graph (which is the full width of the screen minus gutters). */
function useGraphWidth() {
  const { width } = useWindowDimensions();
  return width - 32;
}
//#endregion
