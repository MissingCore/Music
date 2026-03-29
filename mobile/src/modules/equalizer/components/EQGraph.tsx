import {
  Canvas,
  Circle,
  LinearGradient,
  Path,
  Skia,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { View, useWindowDimensions } from "react-native";

import { useTheme } from "~/hooks/useTheme";

import { Em } from "~/components/Typography/StyledText";

const VerticalBuffer = 16;
const HeightRange = 72; // Height above & below x-axis.
const BufferedHeightRange = HeightRange - VerticalBuffer;
const GraphHeight = HeightRange * 2 + 1;
const XAxisYPos = HeightRange + 1;

interface EQGraphProps extends EQLineProps {}

export function EQGraph(props: EQGraphProps) {
  return (
    <View
      style={{ height: GraphHeight }}
      className="relative w-full rounded-xl bg-surfaceContainerLowest"
    >
      <Canvas style={{ height: "100%", width: "100%" }}>
        <XAxisPath />
        <FixedFrequencyLabelPaths />
        <EQLine bound={props.bound} points={props.points} />
      </Canvas>
      <FixedFrequencyLabels />
    </View>
  );
}

//#region Dynamic Components
interface EQLineProps {
  bound: number;
  points: Array<{ x: number; y: number }>;
}

function EQLine(props: EQLineProps) {
  const width = useGraphWidth();
  const {
    onSurfaceVariant,
    surfaceContainerHighest,
    surfaceContainerHigh,
    surfaceContainerLow,
  } = useTheme();

  const points = useMemo(
    () =>
      props.points.map(
        ({ x, y }) =>
          [
            guessXPercentage(x) * width,
            guessYCoordinate(y, props.bound),
          ] as const,
      ),
    [width, props.points, props.bound],
  );

  const path = useMemo(() => {
    const line = Skia.Path.Make().moveTo(0, XAxisYPos);
    points.forEach(([x, y]) => line.lineTo(x, y));
    line.lineTo(width, XAxisYPos).close();
    return line;
  }, [width, points]);

  const minY = useMemo(() => Math.min(...points.map(([_, y]) => y)), [points]);
  const maxY = useMemo(() => Math.max(...points.map(([_, y]) => y)), [points]);

  return (
    <>
      <Path path={path} color={surfaceContainerHighest} style="fill">
        <LinearGradient
          start={{ x: width / 2, y: minY }}
          end={{ x: width / 2, y: maxY }}
          colors={[
            surfaceContainerHigh,
            surfaceContainerLow,
            surfaceContainerHigh,
          ]}
        />
      </Path>
      {points.map(([x, y], index) => (
        <Circle key={index} cx={x} cy={y} r={2} color={onSurfaceVariant} />
      ))}
    </>
  );
}

/**
 * Guess how far from the left the point should be positioned, relative
 * to the fixed frequency bands.
 */
function guessXPercentage(x: number): number {
  const upperBoundIdx = DisplayedFrequencies.findIndex((f) => x < f.value);
  if (upperBoundIdx === -1) throw new Error("Frequency Band not supported.");
  const lowerBound =
    upperBoundIdx === 0
      ? { value: 0, label: "0", percentage: 0 }
      : DisplayedFrequencies[upperBoundIdx - 1]!;
  const upperBound = DisplayedFrequencies[upperBoundIdx]!;

  const workingPercentageArea = upperBound.percentage - lowerBound.percentage;
  const xPercentageInRange =
    (x - lowerBound.value) / (upperBound.value - lowerBound.value);

  return lowerBound.percentage + workingPercentageArea * xPercentageInRange;
}

function guessYCoordinate(y: number, bound: number): number {
  if (y === 0) return XAxisYPos;
  else if (y > 0) {
    return ((bound - y) / bound) * BufferedHeightRange + VerticalBuffer;
  }
  return Math.abs(y / bound) * BufferedHeightRange + XAxisYPos;
}
//#endregion

//#region "Fixed" Components
function XAxisPath() {
  const width = useGraphWidth();
  const { surfaceContainerHighest } = useTheme();

  const path = useMemo(
    () =>
      Skia.Path.Make().moveTo(0, XAxisYPos).lineTo(width, XAxisYPos).close(),
    [width],
  );

  return <Path path={path} color={surfaceContainerHighest} style="stroke" />;
}

const DisplayedFrequencies = [
  { value: 20000, label: "20", percentage: 0.05 },
  { value: 50000, label: "50", percentage: 0.18 },
  { value: 100000, label: "100", percentage: 0.26 },
  { value: 500000, label: "500", percentage: 0.47 },
  { value: 1000000, label: "1K", percentage: 0.56 },
  { value: 5000000, label: "5K", percentage: 0.76 },
  { value: 10000000, label: "10K", percentage: 0.85 },
  { value: 20000000, label: "20K", percentage: 0.95 },
];

function FixedFrequencyLabelPaths() {
  const width = useGraphWidth();
  const { surfaceContainerHighest } = useTheme();

  const paths = useMemo(
    () =>
      DisplayedFrequencies.map(({ percentage }) => {
        const xPos = width * percentage;
        return Skia.Path.Make()
          .moveTo(xPos, 0)
          .lineTo(xPos, GraphHeight)
          .close();
      }),
    [width],
  );

  return paths.map((path, index) => (
    <Path
      key={index}
      path={path}
      color={surfaceContainerHighest}
      style="stroke"
    />
  ));
}

function FixedFrequencyLabels() {
  const width = useGraphWidth();

  const labelCoordinates = useMemo(
    () =>
      DisplayedFrequencies.map(({ label, percentage }) => {
        const xPos = width * percentage;
        return { label, xPos };
      }),
    [width],
  );

  return labelCoordinates.map(({ label, xPos }) => (
    <Em
      key={label}
      style={{ left: xPos, fontSize: 8 }}
      className="absolute top-full left-0 -translate-x-1/2 translate-y-0.5"
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
