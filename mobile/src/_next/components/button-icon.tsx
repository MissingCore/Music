// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { AppColor } from "~/_next/constants/theme";
import { cn } from "~/_next/utils/style";
import type { SupportedIconName } from "./icon";
import { Icon } from "./icon";
import type { RippleProps } from "./ripple";
import { Ripple } from "./ripple";

interface IconButtonProps extends RippleProps {
  accessibilityLabel: string;
  icon: SupportedIconName;
  iconColor?: AppColor;
}

export function IconButton({
  icon,
  iconColor = "text",
  className,
  ...props
}: IconButtonProps) {
  return (
    <Ripple
      {...props}
      className={cn(
        "size-10 items-center justify-center rounded-full",
        className,
      )}
    >
      <Icon name={icon} color={iconColor} />
    </Ripple>
  );
}
