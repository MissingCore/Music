import { Circle, LinearGradient, Path, Skia } from "@shopify/react-native-skia";
import { Fragment, useMemo } from "react";
import { View, useWindowDimensions } from "react-native";
import { Svg, Path as SPath } from "react-native-svg";

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
      className="relative mb-4 w-full rounded-xl bg-surfaceContainerLowest"
    >
      <Svg style={{ height: "100%", width: "100%" }}>
        <GraphAnnotations />
      </Svg>

      {/* <Canvas style={{ height: "100%", width: "100%" }}>
        <EQLine bound={props.bound} points={props.points} />
      </Canvas> */}
    </View>
  );
}

// //#region Dynamic Components
// interface EQLineProps {
//   bound: number;
//   points: Array<{ x: number; y: number }>;
// }

// function EQLine(props: EQLineProps) {
//   const width = useGraphWidth();
//   const { onSurfaceVariant, surfaceContainerHighest } = useTheme();

//   const points = useMemo(
//     () =>
//       props.points.map(
//         ({ x, y }) =>
//           [
//             guessXPercentage(x) * width,
//             guessYCoordinate(y, props.bound),
//           ] as const,
//       ),
//     [width, props.points, props.bound],
//   );

//   const path = useMemo(() => {
//     const line = Skia.Path.Make().moveTo(0, XAxisYPos);
//     points.forEach(([x, y]) => line.lineTo(x, y));
//     line.lineTo(width, XAxisYPos).close();
//     return line;
//   }, [width, points]);

//   const minY = useMemo(() => Math.min(...points.map(([_, y]) => y)), [points]);
//   const maxY = useMemo(() => Math.max(...points.map(([_, y]) => y)), [points]);

//   return (
//     <>
//       {minY < XAxisYPos ? (
//         <Path path={path} color={surfaceContainerHighest} style="fill">
//           <LinearGradient
//             start={{ x: width / 2, y: minY }}
//             end={{ x: width / 2, y: XAxisYPos }}
//             colors={[surfaceContainerHighest, `${surfaceContainerHighest}0D`]}
//           />
//         </Path>
//       ) : null}
//       {maxY > XAxisYPos ? (
//         <Path path={path} color={surfaceContainerHighest} style="fill">
//           <LinearGradient
//             start={{ x: width / 2, y: XAxisYPos }}
//             end={{ x: width / 2, y: maxY }}
//             colors={[`${surfaceContainerHighest}0D`, surfaceContainerHighest]}
//           />
//         </Path>
//       ) : null}
//       {points.map(([x, y], index) => (
//         <Circle key={index} cx={x} cy={y} r={2} color={onSurfaceVariant} />
//       ))}
//     </>
//   );
// }

// /**
//  * Guess how far from the left the point should be positioned, relative
//  * to the fixed frequency bands.
//  */
// function guessXPercentage(x: number): number {
//   const upperBoundIdx = DisplayedFrequencies.findIndex((f) => x < f.value);
//   if (upperBoundIdx === -1) throw new Error("Frequency Band not supported.");
//   const lowerBound =
//     upperBoundIdx === 0
//       ? { value: 0, label: "0", percentage: 0 }
//       : DisplayedFrequencies[upperBoundIdx - 1]!;
//   const upperBound = DisplayedFrequencies[upperBoundIdx]!;

//   const workingPercentageArea = upperBound.percentage - lowerBound.percentage;
//   const xPercentageInRange =
//     (x - lowerBound.value) / (upperBound.value - lowerBound.value);

//   return lowerBound.percentage + workingPercentageArea * xPercentageInRange;
// }

// function guessYCoordinate(y: number, bound: number): number {
//   if (y === 0) return XAxisYPos;
//   else if (y > 0) {
//     return ((bound - y) / bound) * BufferedHeightRange + VerticalBuffer;
//   }
//   return Math.abs(y / bound) * BufferedHeightRange + XAxisYPos;
// }
// //#endregion

//#region Graph Annotations
const DisplayedFrequencies = [
  { label: "20", value: 20000, xPosPercent: 0.05 },
  { label: "50", value: 50000, xPosPercent: 0.18 },
  { label: "100", value: 100000, xPosPercent: 0.26 },
  { label: "500", value: 500000, xPosPercent: 0.47 },
  { label: "1K", value: 1000000, xPosPercent: 0.56 },
  { label: "5K", value: 5000000, xPosPercent: 0.76 },
  { label: "10K", value: 10000000, xPosPercent: 0.85 },
  { label: "20K", value: 20000000, xPosPercent: 0.95 },
];

/** Draws x-axis and tick marks + labels for certain frequencies. */
function GraphAnnotations() {
  const width = useGraphWidth();
  const { surfaceContainerHighest } = useTheme();
  return (
    <>
      {/* X-axis */}
      <SPath
        d={`M ${0} ${XAxisYPos} L ${width} ${XAxisYPos}`}
        stroke={surfaceContainerHighest}
      />
      {/* Frequency Tick Marks + Labels */}
      {DisplayedFrequencies.map(({ label, xPosPercent }) => {
        const xPos = width * xPosPercent;
        return (
          <Fragment key={label}>
            <SPath
              d={`M ${xPos} ${0} L ${xPos} ${GraphHeight}`}
              stroke={surfaceContainerHighest}
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
