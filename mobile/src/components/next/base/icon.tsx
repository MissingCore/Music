// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { createNanoIconSet } from "react-native-nano-icons";

import type { AppColor } from "~/modules/customization/theme/core/constants";
import { useColor } from "~/modules/customization/theme/hooks";
import glyphMap from "~/resources/icons/app-icons.glyphmap.json";

const AppIcons = createNanoIconSet(glyphMap);

export type SupportedIconName = React.ComponentProps<typeof AppIcons>["name"];

interface IconProps {
  name: SupportedIconName;
  /** Defaults to `24px`. */
  size?: number;
  /** Defaults to theme's `onSurface` color. */
  color?: AppColor;
}

export function Icon({ name, size = 24, color }: IconProps) {
  const usedColor = useColor(color, "onSurface");
  return (
    <AppIcons
      name={name}
      size={size}
      color={usedColor}
      allowFontScaling={false}
    />
  );
}
