// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { AppColor } from "~/_next/constants/theme";
import { cn } from "~/_next/utils/style";
import { useBlurStyle } from "./primitives/blur";
import type { SupportedIconName } from "./icon";
import { Icon } from "./icon";
import type { RippleProps } from "./ripple";
import { Ripple } from "./ripple";

const SIZE_CONFIG = {
  sm: { className: "size-8", size: 24 },
  base: { className: "size-10", size: 24 },
  lg: { className: "size-12", size: 24 },
} as const;

export interface IconButtonProps extends RippleProps {
  accessibilityLabel: string;
  icon: SupportedIconName;
  iconColor?: AppColor;
  size?: keyof typeof SIZE_CONFIG;
}

export function IconButton({
  icon,
  iconColor = "text",
  className,
  size = "base",
  ...props
}: IconButtonProps) {
  return (
    <Ripple
      {...props}
      className={cn(
        "items-center justify-center rounded-full",
        SIZE_CONFIG[size].className,
        className,
      )}
    >
      <Icon name={icon} color={iconColor} size={SIZE_CONFIG[size].size} />
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
