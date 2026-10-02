// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { VariantProps } from "cva/config";

import { cva } from "~/lib/style";
import type { AppColor } from "~/modules/customization/theme/core/constants";
import type { ButtonProps } from "./button";
import { Button } from "./button";
import type { SupportedIconName } from "../base/icon";
import { Icon } from "../base/icon";
import { getIntentOnColor } from "../base/theming";

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

export type ButtonSize = IconButtonVariants["size"];

interface IconButtonProps extends ButtonProps, IconButtonVariants {
  icon: SupportedIconName;
  accessibilityLabel: string;
  _iconColor?: AppColor;
}

const IconSizeConfig = { xs: 20, sm: 24, md: 24, lg: 32 };

export function IconButton({
  icon,
  size = "sm",
  wide,
  className,
  _iconColor,
  ...props
}: IconButtonProps) {
  return (
    <Button {...props} className={iconButtonStyle({ size, wide, className })}>
      <Icon
        name={icon}
        size={IconSizeConfig[size]}
        color={_iconColor ?? getIntentOnColor(props.intent)}
      />
    </Button>
  );
}
