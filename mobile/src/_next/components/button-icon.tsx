// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { AppColor } from "~/_next/constants/theme";
import { cn } from "~/_next/utils/style";
import { useBlurStyle } from "./primitives/blur";
import type { SupportedIconName } from "./icon";
import { Icon } from "./icon";
import type { RippleProps } from "./ripple";
import { Ripple } from "./ripple";

export interface IconButtonProps extends RippleProps {
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

export type BlurIconButtonProps = Omit<IconButtonProps, "color" | "iconColor">;

export function BlurIconButton({ style, ...props }: BlurIconButtonProps) {
  const blurStyle = useBlurStyle();
  return (
    <IconButton
      {...props}
      iconColor="#FFF"
      color="#FFF"
      style={[blurStyle, style]}
    />
  );
}
