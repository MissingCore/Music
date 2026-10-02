// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from "react";
import { View } from "react-native";
import type { CircleProps } from "react-native-svg";
import Svg, { Circle, Defs, Mask, Rect } from "react-native-svg";

import { isRecord } from "~/utils/validation";
import { Colors } from "~/constants/Styles";
import type { MediaImageSrc } from "~/components/next/composed/media-image";
import { MediaImage } from "~/components/next/composed/media-image";
import { useTheme } from "~/modules/customization/theme/hooks";

const CENTER = { cx: 384, cy: 384 };
const GROOVES = {
  pointerEvents: "none",
  ...CENTER,
  fill: "none",
  stroke: "#FFF",
  strokeWidth: 3,
  opacity: 0.075,
} satisfies CircleProps;

/**
 * Plain vinyl component. Need this convoluted way as the SVG `<Image />`
 * component is slow (ie: the image doesn't load immediately on first look).
 */
export function Vinyl(props: {
  onPress?: () => Promise<void> | void;
  size: number;
  src: MediaImageSrc;
}) {
  const { surface } = useTheme();

  const src = isRecord(props.src) ? null : props.src;

  // Render indicator if we have an empty array or no defined image.
  const renderIndicator = useMemo(
    () => (Array.isArray(src) && src.length === 0) || src === null,
    [src],
  );

  return (
    <View className="relative items-center justify-center">
      <MediaImage
        src={src}
        size={props.size / 2}
        className="absolute rounded-full bg-primary"
        noPlaceholder
      />
      <Svg width={props.size} height={props.size} viewBox="0 0 768 768">
        <Defs>
          <Mask id="hole">
            <Circle {...CENTER} r={384} fill="white" />
            <Circle {...CENTER} r={192} fill="black" />
          </Mask>
        </Defs>
        {/* Background */}
        <Circle
          {...CENTER}
          r={384}
          fill={Colors.neutral10}
          mask="url(#hole)"
          onPress={props.onPress}
        />
        {/* Grooves */}
        <Circle {...GROOVES} r={264} />
        <Circle {...GROOVES} r={304} />
        <Circle {...GROOVES} r={344} />
        {/* Spin Indicator */}
        {renderIndicator ? (
          <Rect
            pointerEvents="none"
            x={384}
            y={193}
            width={2}
            height={24}
            fill="#FFF"
          />
        ) : null}
        {/* Center hole */}
        <Circle
          pointerEvents="none"
          {...CENTER}
          r={12}
          fill={surface}
          stroke={Colors.neutral80}
          strokeWidth={6}
        />
      </Svg>
    </View>
  );
}
