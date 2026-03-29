import { Fragment, useMemo } from "react";
import { View, useWindowDimensions } from "react-native";
import {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
  Svg,
} from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";

import { Em } from "~/components/Typography/StyledText";

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
        <EQLine bound={props.bound} points={props.points} />
      </Svg>
    </View>
  );
}

//#region EQ Line
interface EQLineProps {
  /** Largest absolute value from 0. */
  bound: number;
  /** Array of frequency (x) to their band level (y). */
  points: Array<{ x: number; y: number }>;
}

function EQLine(props: EQLineProps) {
  const width = useGraphWidth();
  const { scheme, onSurfaceVariant, surfaceContainerHigh } = useTheme();

  const points = useMemo(
    () =>
      props.points.map(({ x, y }) => ({
        x: guessXPercentage(x) * width,
        y: guessYCoordinate(y, props.bound),
      })),
    [width, props.points, props.bound],
  );

  const path = useMemo(() => {
    const linePoints = [`M ${0} ${XAxisYPos}`];
    points.forEach((point) => linePoints.push(`L ${point.x} ${point.y}`));
    linePoints.push(`L ${width} ${XAxisYPos}`);
    return linePoints.join(" ");
  }, [width, points]);

  const minY = useMemo(() => Math.min(...points.map(({ y }) => y)), [points]);
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

/** Draws x-axis and tick marks + labels for certain frequencies. */
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
          <Fragment key={label}>
            <Path
              d={`M ${xPos} ${0} L ${xPos} ${GraphHeight}`}
              stroke={surfaceContainer}
            />
            <Em
              style={{ left: xPos, fontSize: 8 }}
              className="absolute top-full left-0 -translate-x-1/2 translate-y-0.5"
            >
              {label}
            </Em>
          </Fragment>
        );
      })}
    </>
  );
}
//#endregion

//#region Utils
/** Returns width of the graph (which is the full width of the screen minus gutters). */
function useGraphWidth() {
  const { width } = useWindowDimensions();
  return width - 32;
}
//#endregion
