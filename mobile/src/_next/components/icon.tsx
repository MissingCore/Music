// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ViewStyle } from "react-native";
import { View } from "react-native";
import { createNanoIconSet } from "react-native-nano-icons";

import glyphMap from "~/_next/resources/icons/icons.glyphmap.json";

import { useColor } from "~/_next/context/theme-context";

import type { AppColor } from "~/_next/constants/theme";

const AppIcons = createNanoIconSet(glyphMap);

export type SupportedIconName = React.ComponentProps<typeof AppIcons>["name"];

interface IconProps {
  name: SupportedIconName;
  size?: number;
  color?: AppColor;
  className?: string;
  style?: ViewStyle;
}

export function Icon({
  name,
  size = 24,
  color = "text",
  className,
  style,
}: IconProps) {
  const iconColor = useColor(color);

  const renderedComponent = (
    <AppIcons
      name={name}
      size={size}
      color={iconColor}
      allowFontScaling={false}
    />
  );

  if (!className && !style) return renderedComponent;
  return (
    <View pointerEvents="none" className={className} style={style}>
      {renderedComponent}
    </View>
  );
}
