// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { memo } from "react";

import type { SupportedIconName } from "~/resources/icons";
import { Icon } from "~/resources/icons";

import { cn } from "~/lib/style";
import { capitalize } from "~/utils/string";
import type { AppColor } from "~/modules/customization/theme/core/constants";
import type { RipplePressProps } from "../../Base/Pressable";
import { Ripple } from "../../Base/Pressable";

export type ButtonSize = "xs" | "sm" | "md" | "lg";

const ButtonConfig = {
  xs: { buttonSize: "min-h-8 min-w-8", iconSize: 20 },
  sm: { buttonSize: "min-h-10 min-w-10", iconSize: 24 },
  md: { buttonSize: "min-h-12 min-w-12", iconSize: 24 },
  lg: { buttonSize: "min-h-12 min-w-12", iconSize: 32 },
} as const;

type IconButtonProps = RipplePressProps & {
  icon: SupportedIconName;
  accessibilityLabel: string;
  /** Defaults to `md`. */
  size?: ButtonSize;
  className?: string;
  _fullRipple?: boolean;
  _iconColor?: AppColor;
};

//#region Default
export const IconButton = memo(function IconButton({
  icon,
  size = "sm",
  _fullRipple = false,
  _iconColor,
  ...props
}: IconButtonProps) {
  const { buttonSize, iconSize } = ButtonConfig[size];
  return (
    <Ripple
      {...props}
      rippleRadius={_fullRipple ? undefined : (iconSize + 12) / 2}
      className={cn(
        "items-center justify-center rounded-full disabled:opacity-25",
        buttonSize,
        props.className,
      )}
    >
      <Icon name={icon} size={iconSize} color={_iconColor} />
    </Ripple>
  );
});
//#endregion

//#region Filled
const ButtonTheme = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  error: "bg-error",
} as const;

export const FilledIconButton = memo(function FilledIconButton(
  props: IconButtonProps & { theme?: keyof typeof ButtonTheme },
) {
  return (
    <IconButton
      rippleColor={props.theme ? `${props.theme}Dim` : undefined}
      _iconColor={props.theme ? `on${capitalize(props.theme)}` : undefined}
      {...props}
      className={cn(
        "bg-surfaceContainerLowest",
        props.theme ? ButtonTheme[props.theme] : undefined,
        props.className,
      )}
      _fullRipple
    />
  );
});
//#endregion
