// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { SupportedIconName } from "./icon";
import { Icon } from "./icon";
import type { RippleProps } from "./ripple";
import { Ripple } from "./ripple";

interface BlurIconButtonProps extends RippleProps {
  icon: SupportedIconName;
  accessibilityLabel: string;
}

export function BlurIconButton({ icon, ...rest }: BlurIconButtonProps) {
  return (
    <Ripple
      {...rest}
      rippleColor="#FFFFFF"
      className="size-10 items-center justify-center rounded-full border border-white/15 bg-white/15"
    >
      <Icon name={icon} color="#FFFFFF" />
    </Ripple>
  );
}
