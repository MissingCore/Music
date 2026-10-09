// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { VariantProps } from "cva/config";

import { cva } from "~/lib/style";
import type { AppColor } from "~/modules/customization/theme/core/constants";
import type { ButtonProps } from "./button";
import { Button } from "./button";
import type { SupportedIconName } from "./icon";
import { Icon } from "./icon";
import { getIntentOnColor } from "./styles";

const iconButtonStyle = cva({
  base: "rounded-full p-0",
  variants: {
    size: {
      xs: "min-h-8 min-w-8",
      sm: "min-h-10 min-w-10",
      md: "min-h-12 min-w-12",
      lg: "min-h-12 min-w-12",
    },
    wide: { true: null },
  },
  compoundVariants: [
    { size: "xs", wide: true, className: "min-w-14" },
    { size: "sm", wide: true, className: "min-w-16" },
    { size: ["md", "lg"], wide: true, className: "min-w-18" },
  ],
  defaultVariants: { size: "sm", wide: false },
});

type IconButtonVariants = VariantProps<typeof iconButtonStyle>;

interface IconButtonProps extends ButtonProps, IconButtonVariants {
  icon: SupportedIconName;
  accessibilityLabel: string;
  _iconColor?: AppColor;
  /**
   * Used to override the default styling.
   *
   * @deprecated We want to reconsider the icon scaling based on the button size.
   */
  _iconSize?: number;
}

export type ButtonSize = IconButtonVariants["size"];
const IconSizeConfig = {
  xs: 20,
  sm: 24,
  md: 24,
  lg: 32,
} as const satisfies Record<NonNullable<ButtonSize>, number>;

export function IconButton({
  icon,
  size = "sm",
  wide,
  className,
  _iconColor,
  _iconSize,
  filled = false,
  ...props
}: IconButtonProps) {
  return (
    <Button
      {...props}
      filled={filled}
      className={iconButtonStyle({ size, wide, className })}
    >
      <Icon
        name={icon}
        size={_iconSize || IconSizeConfig[size]}
        color={_iconColor ?? getIntentOnColor(props.intent)}
      />
    </Button>
  );
}
