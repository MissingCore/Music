import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { useMemo } from "react";
import { View, useWindowDimensions } from "react-native";

import { useTheme } from "~/hooks/useTheme";

import { Em } from "~/components/Typography/StyledText";

const HeightRange = 80; // Height above & below x-axis.
const GraphHeight = HeightRange * 2 + 1;
const XAxisYPos = HeightRange + 1;

export function EQGraph() {
  return (
    <View
      style={{ height: GraphHeight }}
      className="relative w-full rounded-xl bg-surfaceContainerLowest"
    >
      <Canvas style={{ height: "100%", width: "100%" }}>
        <XAxisPath />
        <FixedFrequencyLabelPaths />
      </Canvas>
      <FixedFrequencyLabels />
    </View>
  );
}

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
  { value: 20000000, label: "200K", percentage: 0.95 },
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
