// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { VariantProps } from "cva/config";

import { cva } from "~/lib/style";
import type { AppColor } from "~/modules/customization/theme/core/constants";
import type { SupportedIconName } from "../base/icon";
import { Icon } from "../base/icon";
import type { RippleProps } from "../base/ripple";
import { Ripple } from "../base/ripple";
import type { IntentVariant } from "../base/theming";
import { getIntentOnColor, getIntentRippleColor } from "../base/theming";

const iconButtonStyle = cva({
  base: "items-center justify-center rounded-full disabled:opacity-25",
  variants: {
    intent: {
      unset: null,
      muted: null,
      primary: null,
      secondary: null,
      error: null,
    } satisfies IntentVariant,
    size: {
      xs: "min-h-8 min-w-8",
      sm: "min-h-10 min-w-10",
      md: "min-h-12 min-w-12",
      lg: "min-h-12 min-w-12",
    },
    filled: { true: "bg-surfaceContainerLowest" },
    wide: { true: null },
  },
  compoundVariants: [
    { intent: "muted", filled: true, className: "bg-surfaceContainerHigh" },
    { intent: "primary", filled: true, className: "bg-primary" },
    { intent: "secondary", filled: true, className: "bg-secondary" },
    { intent: "error", filled: true, className: "bg-error" },
    { size: "xs", wide: true, className: "min-w-12" },
    { size: "sm", wide: true, className: "min-w-14" },
    { size: ["md", "lg"], wide: true, className: "min-w-16" },
  ],
  defaultVariants: { intent: "unset", size: "sm", filled: false, wide: false },
});

interface IconButtonProps
  extends
    Omit<RippleProps, "rippleRadius">,
    VariantProps<typeof iconButtonStyle> {
  icon: SupportedIconName;
  accessibilityLabel: string;
  _iconColor?: AppColor;
}

const IconSizeConfig = { xs: 20, sm: 24, md: 24, lg: 32 };

export function IconButton({
  icon,
  intent,
  size = "sm",
  filled,
  wide,
  className,
  rippleColor,
  _iconColor,
  ...props
}: IconButtonProps) {
  return (
    <Ripple
      {...props}
      rippleColor={rippleColor ?? getIntentRippleColor(intent)}
      className={iconButtonStyle({ intent, size, filled, wide, className })}
    >
      <Icon
        name={icon}
        size={IconSizeConfig[size]}
        color={_iconColor ?? getIntentOnColor(intent)}
      />
    </Ripple>
  );
}
