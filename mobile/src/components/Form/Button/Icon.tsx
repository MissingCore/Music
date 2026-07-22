// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { memo } from "react";
import { View } from "react-native";

import type { SupportedIconName } from "~/resources/icons";
import { Icon } from "~/resources/icons";

import { cn } from "~/lib/style";
import type { AppColor } from "~/modules/customization/theme/core/constants";
import { useColor } from "~/modules/customization/theme/hooks";
import type { PressProps } from "../../Base/Pressable";
import { Pressable } from "../../Base/Pressable";

export type ButtonSize = "xs" | "sm" | "md" | "lg";

const ButtonConfig = {
  xs: { buttonSize: "min-h-8 min-w-8", iconSize: 20 },
  sm: { buttonSize: "min-h-10 min-w-10", iconSize: 24 },
  md: { buttonSize: "min-h-12 min-w-12", iconSize: 24 },
  lg: { buttonSize: "min-h-12 min-w-12", iconSize: 32 },
} as const;

type IconButtonProps = PressProps & {
  icon: SupportedIconName;
  accessibilityLabel: string;
  /** Defaults to `md`. */
  size?: ButtonSize;
  className?: string;
  _iconColor?: AppColor;
  _rippleColor?: AppColor;
};

//#region Default
export const IconButton = memo(function IconButton({
  icon,
  size = "sm",
  _iconColor,
  _rippleColor,
  ...props
}: IconButtonProps) {
  const rippleColor = useColor(_rippleColor, "surfaceContainerHigh");
  const { buttonSize, iconSize } = ButtonConfig[size];
  return (
    <Pressable
      {...props}
      className={cn(
        "items-center justify-center rounded-full disabled:opacity-25",
        buttonSize,
        props.className,
      )}
    >
      {({ pressed }) => (
        <View
          collapsable={false} // Prevents view flattening.
          style={[pressed && { backgroundColor: `${rippleColor}80` }]}
          className="rounded-full p-1.5"
        >
          <Icon name={icon} size={iconSize} color={_iconColor} />
        </View>
      )}
    </Pressable>
  );
});
//#endregion

//#region Filled
export const FilledIconButton = memo(function FilledIconButton({
  icon,
  size = "sm",
  _iconColor,
  ...props
}: IconButtonProps) {
  const { buttonSize, iconSize } = ButtonConfig[size];
  return (
    <Pressable
      {...props}
      className={cn(
        "items-center justify-center rounded-full bg-surfaceContainerLowest active:bg-surfaceContainer disabled:opacity-25",
        buttonSize,
        props.className,
      )}
    >
      <Icon name={icon} size={iconSize} color={_iconColor} />
    </Pressable>
  );
});
//#endregion
