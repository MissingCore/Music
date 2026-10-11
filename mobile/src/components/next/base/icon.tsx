// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ViewStyle } from "react-native";
import { View } from "react-native";
import { createNanoIconSet } from "react-native-nano-icons";

import glyphMap from "~/resources/icons/app-icons.glyphmap.json";

import type { AppColor } from "~/modules/customization/theme/core/constants";
import { useColor } from "~/modules/customization/theme/hooks";

const AppIcons = createNanoIconSet(glyphMap);

export type SupportedIconName = React.ComponentProps<typeof AppIcons>["name"];

interface IconProps {
  name: SupportedIconName;
  /** Defaults to `24px`. */
  size?: number;
  /** Defaults to theme's `onSurface` color. */
  color?: AppColor;
  className?: string;
  style?: ViewStyle;
}

export function Icon({ name, size = 24, color, className, style }: IconProps) {
  const usedColor = useColor(color, "onSurface");

  const renderedComponent = (
    <AppIcons
      name={name}
      size={size}
      color={usedColor}
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
