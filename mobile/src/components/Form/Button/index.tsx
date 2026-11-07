// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { memo } from "react";

import { cn } from "~/lib/style";
import type { RippleProps } from "../../Base/Pressable";
import { Ripple } from "../../Base/Pressable";

//#region Default
export const Button = memo(function Button({
  className,
  ...props
}: RippleProps) {
  return (
    <Ripple
      className={cn(
        "bg-surfaceContainerLowest p-4 disabled:opacity-25",
        className,
      )}
      {...props}
    />
  );
});
//#endregion
